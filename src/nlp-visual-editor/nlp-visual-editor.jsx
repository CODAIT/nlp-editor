/*

Copyright 2022 Elyra Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import React from 'react';
import { IntlProvider } from 'react-intl';
import { connect, Provider } from 'react-redux';
import axios from 'axios';
import shortUUID from 'short-uuid';
import {
  CommonCanvas,
  CanvasController,
  CommonProperties,
} from '@elyra/canvas';
import { Button, Loading, Modal } from 'carbon-components-react';
import {
  Play32,
  WarningAlt24,
  DocumentDownload32,
  Upload16,
  SettingsAdjust32,
  Close24,
} from '@carbon/icons-react';
import nlpPalette from '../config/nlpPalette.json';
import RHSPanel from './components/rhs-panel';
import LanguageModal from './components/language-modal';
import TabularView from './views/tabular-view';
import DocumentViewer from './views/document-viewer';

import './nlp-visual-editor.scss';
import { store } from '../redux/store';
import NodeValidator from '../utils/NodeValidator';
import { getImmediateUpstreamNodes } from '../utils';
import JsonToXML from '../utils/JsonToXML';
import { processNewNode } from '../utils';
import fileDownload from 'js-file-download';

import {
  deleteNodes,
  saveNlpNode,
  setNlpNodes,
  setInputDocument,
  setPipelineId,
  setTabularResults,
  setShowRightPanel,
  setShowDocumentViewer,
  setDirty,
  setModuleName,
} from '../redux/slice';

const TIMER_TICK = 250; // 1/4 second
const TIMER_TRIES = 40; // 2 minutes
const DEFAULT_LANGUAGE = 'en';
const DEFAULT_MODULE_NAME = 'elyraNLPCanvas';

const languages = {
  ar: 'Arabic',
  bs: 'Bosnian',
  'zh-CN': 'Chinese, simplified',
  'zh-TW': 'Chinese, traditional',
  hr: 'Croatian',
  cs: 'Czech',
  da: 'Danish',
  nl: 'Dutch',
  en: 'English',
  fi: 'Finnish',
  fr: 'French',
  de: 'German',
  he: 'Hebrew',
  hi: 'Hindi',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  nb: 'Norwegian (Bokmål)',
  nn: 'Norwegian (Nynorsk)',
  pl: 'Polish',
  pt: 'Portuguese, Brazilian',
  ro: 'Romanian',
  ru: 'Russian',
  sr: 'Serbian',
  sk: 'Slovak',
  es: 'Spanish',
  sv: 'Swedish',
};

const aqlReserved = [
  'all',
  'allow',
  'allow_empty',
  'always',
  'and',
  'annotate',
  'as',
  'ascending',
  'ascii',
  'attribute',
  'between',
  'blocks',
  'both',
  'by',
  'called',
  'case',
  'cast',
  'ccsid',
  'character',
  'characters',
  'columns',
  'consolidate',
  'content_type',
  'count',
  'create',
  'default',
  'descending',
  'detag',
  'detect',
  'deterministic',
  'dictionary',
  'dictionaries',
  'document',
  'element',
  'else',
  'empty_fileset',
  'entries',
  'exact',
  'export',
  'external',
  'external_name',
  'extract',
  'fetch',
  'file',
  'first',
  'flags',
  'folding',
  'from',
  'function',
  'group',
  'having',
  'import',
  'in',
  'include',
  'infinity',
  'inline_match',
  'input',
  'into',
  'insensitive',
  'java',
  'language',
  'left',
  'lemma_match',
  'like',
  'limit',
  'mapping',
  'matching_regex',
  'minus',
  'module',
  'name',
  'never',
  'not',
  'null',
  'on',
  'only',
  'order',
  'output',
  'part_of_speech',
  'parts_of_speech',
  'parameter',
  'pattern',
  'point',
  'points',
  'priority',
  'regex',
  'regexes',
  'retain',
  'required',
  'return',
  'right',
  'rows',
  'select',
  'separation',
  'set',
  'specific',
  'split',
  'table',
  'tagger',
  'then',
  'token',
  'Token',
  'tokens',
  'unicode',
  'union',
  'up',
  'using',
  'values',
  'view',
  'views',
  'when',
  'where',
  'with',
  'Text',
  'Span',
  'Integer',
  'Float',
  'String',
  'Boolean',
  'ScalarList',
  'Dictionary',
  'Regex',
  'Consolidate',
  'Block',
  'BlockTok',
  'Sentence',
  'Tokenize',
  'RegexTok',
  'PosTag',
];

class VisualEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      selectedNodeId: undefined,
      enableFlowExecutionBtn: false,
      errorMessage: undefined,
      languageSelectModal: false,
      showSettings: false,
      editorSettings: localStorage.getItem('nlpEditorSettings')
        ? JSON.parse(localStorage.getItem('nlpEditorSettings'))
        : {
            moduleName: DEFAULT_MODULE_NAME,
            language: DEFAULT_LANGUAGE,
          },
      showBottomPanel: props.tabularResults !== undefined,
    };

    this.props.setModuleName(this.state.editorSettings.moduleName);

    this.canvasController = new CanvasController();
    this.canvasController.openPalette();
    this.canvasController.setPipelineFlowPalette(nlpPalette);

    this.setCurrentLanguage(this.state.editorSettings.language);

    this.nodeValidator = new NodeValidator(this.canvasController);
    this.jsonToXML = new JsonToXML(this.canvasController);
    this.tickCounter = 0;
  }

  componentDidMount() {
    const id = this.canvasController.getPrimaryPipelineId();
    this.props.setPipelineId({
      pipelineId: id,
    });
    window.onbeforeunload = (e) => {
      if (this.props.dirty) {
        return 'Unsaved changes. Proceed?';
      }
    };
  }

  componentDidUpdate = (prevProps, prevState) => {
    //listening to update the names of nodes when changed on their panel
    const names = this.props.nodes.map((n) => n.label).join();
    const { nodes } = this.canvasController.getPipeline(this.props.pipelineId);
    const pipelineNames = nodes.map((n) => n.label).join();
    if (names !== pipelineNames) {
      //if nodenames changed, update flow structure
      this.props.nodes.forEach((n) => {
        const { nodeId, label } = n;
        this.canvasController.setNodeLabel(
          nodeId,
          label,
          this.props.pipelineId,
        );
      });
    }
    if (
      prevProps.tabularResults === undefined &&
      this.props.tabularResults !== undefined &&
      !prevState.showBottomPanel
    ) {
      this.setState({ showBottomPanel: true });
    }
  };

  transformToXML = () => {
    const { nodes, pipelineId } = this.props;
    const { selectedNodeId, editorSettings } = this.state;
    const payload = [];

    let upstreamNodeIds = this.canvasController
      .getUpstreamNodes([selectedNodeId], pipelineId)
      .nodes[pipelineId].reverse();

    const objNodes = nodes.reduce((sum, curr) => {
      sum[curr.nodeId] = { ...{}, ...curr };
      return sum;
    }, {});

    upstreamNodeIds.forEach((id) => {
      let node = objNodes[id];
      if (node.type !== 'input') {
        const results = this.jsonToXML.transform(
          node,
          editorSettings.moduleName,
        );
        if (!Array.isArray(results)) {
          //dictionaries return a list
          const { xml, label } = results;
          payload.push({ xml, label });
        } else {
          results.forEach((result) => {
            const { xml, label } = result;
            payload.push({ xml, label });
          });
        }
      }
    });
    return payload;
  };

  validatePipeline = () => {
    const { nodes, pipelineId } = this.props;
    const { selectedNodeId } = this.state;

    let upstreamNodeIds = this.canvasController
      .getUpstreamNodes([selectedNodeId], pipelineId)
      .nodes[pipelineId].reverse();

    let response = {};
    const isValid = upstreamNodeIds.every((id) => {
      const node = nodes.find((n) => n.nodeId === id);
      response = this.nodeValidator.validate(pipelineId, node, nodes);
      const { isValid } = response;
      return isValid;
    });
    if (!isValid) {
      const { error } = response;
      this.setState({ errorMessage: error });
    }
    return isValid;
  };

  fetchResults = (exportPipeline, workingId) => {
    const url = `/api/results?workingId=${workingId}&exportPipeline=${exportPipeline}`;
    fetch(url)
      .then((res) => (exportPipeline ? res : res.json()))
      .then(async (data) => {
        const { status } = data;
        if (status === 'in-progress') {
          if (this.tickCounter >= TIMER_TRIES) {
            this.tickCounter = 0; //reset counter
            clearInterval(this.timer);
            this.setState({
              isLoading: false,
              errorMessage: 'No results were generated, try running again.',
            });
          }
          this.tickCounter += 1;
        } else if (status === 'success' || status === 200) {
          clearInterval(this.timer);
          if (exportPipeline) {
            const reader = data.body.getReader();
            const contents = await reader.read();
            fileDownload(contents.value, 'NLP_Canvas_Export.zip');
            this.setState({ isLoading: false });
          } else {
            const { names = [] } = data;
            let state = { isLoading: false };
            if (names.length === 0) {
              state = {
                ...state,
                errorMessage: 'No matches were found in the input document.',
              };
            }
            this.setState({ ...state });
            this.props.setTabularResults(data);
          }
        } else if (status === 'error') {
          const { message } = data;
          clearInterval(this.timer);
          this.setState({
            isLoading: false,
            errorMessage: message,
          });
          this.props.setTabularResults(undefined);
        }
      });
  };

  execute = (payload, exportPipeline, workingId) => {
    this.setState({ isLoading: true });
    const formData = new FormData();
    formData.append('file', this.state.payloadDocument);
    formData.append('workingId', workingId);
    formData.append('payload', JSON.stringify(payload));
    formData.append('language', this.getCurrentLanguage() ?? DEFAULT_LANGUAGE);
    formData.append('exportPipeline', exportPipeline);
    formData.append('payloadDocument', this.state.payloadDocument);
    axios
      .post('/api/run', formData, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      .then((res) => {
        const { data } = res;
        if (!exportPipeline) {
          const { document } = data;
          this.props.setInputDocument({ document });
          this.props.setShowDocumentViewer({ showViewer: true });
        }
        let counter = 0;
        //poll for results at specific interval
        this.timer = setInterval(() => {
          counter += 1;
          if (counter > 600) {
            clearInterval(this.timer);
            this.setState({ isLoading: false });
          }
          this.fetchResults(exportPipeline, workingId);
        }, TIMER_TICK);
      });
  };

  runPipeline = (exportPipeline) => {
    const workingId = shortUUID.generate();
    console.time('validating nlp nodes');
    const isValid = this.validatePipeline();
    console.timeEnd('validating nlp nodes');
    if (!isValid) {
      return false;
    }

    if (!exportPipeline) {
      this.props.setTabularResults(undefined);
    }

    console.time('transforming nlp nodes to XML');
    const payload = this.transformToXML();
    console.timeEnd('transforming nlp nodes to XML');
    this.execute(payload, exportPipeline, workingId);
  };

  savePipeline = () => {
    const { nodes } = this.props;
    const flow = this.canvasController.getPipelineFlow();
    //reset the input node, when importing we need to prompt user to select document
    const tmpNodes = nodes.filter((n) => n.type !== 'input');
    const inputNode = nodes.find((n) => n.type === 'input');
    const newInputNode = { ...inputNode, files: [], isValid: false };
    const newNodes = nodes.length >= 0 ? tmpNodes.concat([newInputNode]) : [];
    const data = {
      flow,
      nodes: newNodes,
    };
    fileDownload(JSON.stringify(data), 'NLP_Canvas_Flow.json');
  };

  getCurrentLanguage = () => {
    const flow = this.canvasController.getPipelineFlow();
    return flow.pipelines?.[0]?.app_data?.language;
  };

  setCurrentLanguage = (language) => {
    const flow = this.canvasController.getPipelineFlow();
    if (flow.pipelines?.[0]) {
      flow.pipelines[0].app_data = {
        ...flow.pipelines[0].app_data,
        language: language,
      };
      this.canvasController.setPipelineFlow(flow);
    }
  };

  setPipelineFlow = ({ flow, nodes }) => {
    const { primary_pipeline: pipelineId } = flow;
    this.props.setShowRightPanel({ showPanel: false });
    this.props.setTabularResults(undefined); // hides tabular view pane
    this.canvasController.setPipelineFlow(flow);
    this.props.setPipelineId({ pipelineId });
    this.props.setNlpNodes({ nodes });
  };

  onFlowSelected = (e) => {
    const { files } = e.target;
    var reader = new FileReader();
    reader.onload = () => {
      try {
        const pipelineJSON = JSON.parse(reader.result);
        const { flow, nodes } = pipelineJSON;
        if (flow === undefined || nodes === undefined) {
          throw 'File does not conform to the Elyra NLP Tooling schema.';
        }
        this.setPipelineFlow(pipelineJSON);
        if (flow.pipelines?.[0]?.app_data?.language) {
          this.setCurrentLanguage(flow.pipelines[0].app_data.language);
          this.setState({
            editorSettings: {
              ...this.state.editorSettings,
              language: flow.pipelines[0].app_data.language,
            },
          });
        }
      } catch (ex) {
        console.log(ex);
        const errorMessage = typeof ex === 'object' ? ex.toString() : ex;
        this.setState({ errorMessage });
      }
    };
    reader.readAsText(files[0]);
  };

  showSettings() {
    this.props.setShowRightPanel({ showPanel: true });
    this.props.setShowDocumentViewer({ showViewer: false });
    this.setState({
      showSettings: true,
    });
  }

  getToolbar = () => {
    const { enableFlowExecutionBtn } = this.state;
    return {
      leftBar: [
        { action: 'palette', label: 'Palette', enable: true },
        { divider: true },
        {
          action: 'settings',
          tooltip: 'Settings',
          jsx: (
            <>
              <Button
                id={'btn-save'}
                size="field"
                kind="ghost"
                iconDescription="Editor Settings"
                renderIcon={SettingsAdjust32}
                onClick={() => this.showSettings()}
              >
                Settings
              </Button>
            </>
          ),
        },
        {
          action: 'save',
          tooltip: 'Save NLP Flow',
          jsx: (
            <>
              <Button
                id={'btn-save'}
                size="field"
                kind="ghost"
                iconDescription="Save document"
                renderIcon={DocumentDownload32}
                onClick={this.savePipeline}
              >
                Save
              </Button>
            </>
          ),
        },
        {
          action: 'open',
          tooltip: 'Open NLP Flow',
          jsx: (
            <>
              <label className="bx--btn bx--btn--md bx--btn--ghost">
                Open
                <input
                  type="file"
                  id="btn-open"
                  className="open-button"
                  name="open"
                  accept=".json"
                  onChange={this.onFlowSelected}
                />
                <Upload16 />
              </label>
            </>
          ),
        },
        {
          action: 'run',
          tooltip: 'Run NLP rule',
          jsx: (
            <>
              <Button
                id={'btn-run'}
                size="field"
                kind="primary"
                renderIcon={Play32}
                disabled={!enableFlowExecutionBtn}
                onClick={() => this.runPipeline(false)}
              >
                Run
              </Button>
            </>
          ),
        },
        {
          action: 'export',
          tooltip: 'Export',
          jsx: (
            <>
              <Button
                id={'btn-run'}
                size="field"
                kind="ghost"
                disabled={this.props.tabularResults === undefined}
                onClick={() => this.runPipeline(true)}
              >
                Export
              </Button>
            </>
          ),
        },
      ],
      rightBar: [
        {
          action: 'language',
          tooltip: 'Select Language',
          jsx: (
            <>
              <Button id={'btn-language'} size="field" kind="ghost" disabled>
                Language ({languages[this.state.editorSettings.language]})
              </Button>
            </>
          ),
        },
      ],
    };
  };

  updateUnionProperties(node) {
    const pipelineLinks = this.canvasController.getLinks(
      this.canvasController.getPrimaryPipelineId(),
    );
    const immediateNodes = getImmediateUpstreamNodes(
      node.nodeId,
      pipelineLinks,
    );
    const upstreamNodes = [];
    immediateNodes.forEach((id, index) => {
      const upstreamNode = this.props.nodes.find((n) => n.nodeId === id);
      const { label, nodeId } = upstreamNode;
      upstreamNodes.push({ label, nodeId });
    });

    //assume it's valid even if user has not interacted with input controls
    const newNode = {
      nodeId: node.nodeId,
      upstreamNodes,
      isValid: true,
    };
    this.props.saveNlpNode({ node: newNode });
  }

  onEditCanvas = (data, command) => {
    const { nodes } = this.props;
    const { editType, editSource, selectedObjectIds } = data;
    if (editSource === 'toolbar' && editType === 'save') {
      return console.log('saving pipeline');
    }
    if (editType === 'deleteSelectedObjects') {
      this.props.setShowRightPanel({ showPanel: false });
      this.setState({ selectedNodeId: undefined });
      this.props.deleteNodes({ ids: selectedObjectIds });
      // Make sure deleted nodes are reflected in union nodes
      for (const node of nodes) {
        if (node.type === 'union') {
          this.updateUnionProperties(node);
        }
      }
    } else if (editType === 'paste') {
      const { clonedNodes } = data;
      clonedNodes.forEach((newNode) => {
        const node = processNewNode(newNode, nodes);
        this.props.saveNlpNode({
          node,
        });
      });
    } else if (['createNode', 'createAutoNode'].includes(editType)) {
      const { newNode } = data;
      const node = processNewNode(newNode, nodes);
      this.props.saveNlpNode({
        node,
      });
    }
    if (['linkNodes', 'deleteLink'].includes(editType)) {
      // Automatically update union node properties when links are created / deleted.
      const linkId = data.id ?? data.linkIds?.[0];
      const link = this.canvasController.getLink(linkId);
      const linkedNodes = [link.srcNodeId, link.trgNodeId];
      for (const nodeId of linkedNodes) {
        const node = nodes.find((n) => n.nodeId === nodeId);
        if (node.type === 'union') {
          this.updateUnionProperties(node);
        }
      }
    }
  };

  onCanvasAreaClick = (source) => {
    const { clickType, objectType } = source;
    const { nodes } = this.props;
    let tmpState = {}; //optimize on the following conditionals
    if (objectType === 'node') {
      const { id } = source;
      tmpState = { ...tmpState, selectedNodeId: id };
      if (clickType === 'DOUBLE_CLICK') {
        //open props panel on double-click to edit node properties
        this.props.setShowDocumentViewer({ showViewer: false });
        this.props.setShowRightPanel({ showPanel: true });
      } else if (clickType === 'SINGLE_CLICK') {
        const node = nodes.find((n) => n.nodeId === id);
        const enableFlowExecutionBtn = node.type !== 'input';
        tmpState = { ...tmpState, enableFlowExecutionBtn };
      }
      this.setState({ ...tmpState });
    } else {
      //if node is not clicked/selected do not enable run button
      this.setState({ enableFlowExecutionBtn: false });
    }
  };

  onErrorModalClosed = () => {
    this.setState({ errorMessage: undefined });
  };

  onRowSelected = (row) => {
    const { indexResult } = row;
    this.props.setShowDocumentViewer({ showViewer: true });

    //remove any previously highlighted selection
    const prevSelectedElement = document.querySelector(
      '.nlp-results-highlight .selected',
    );
    if (prevSelectedElement) {
      prevSelectedElement.classList.remove('selected');
    }

    //scroll to selection
    const clickedElement = document.querySelectorAll(
      '.nlp-results-highlight span[style]',
    )[indexResult];
    const scrollIndex = clickedElement.offsetTop;
    document.querySelector('.nlp-results-highlight').scrollTop =
      scrollIndex - 200;

    //highlight in yellow the selected element
    setTimeout(() => {
      clickedElement.classList.add('selected');
    }, 200);
  };

  getPropertiesInfo() {
    return {
      title: 'NLP Settings',
      parameterDef: {
        titleDefinition: {
          title: 'NLP Settings',
          editable: false,
        },
        current_parameters: this.state.editorSettings,
        parameters: [
          {
            id: 'moduleName',
            type: 'string',
            default: '',
          },
          {
            id: 'language',
            type: 'string',
          },
        ],
        uihints: {
          id: 'Settings',
          editor_size: 'medium',
          label: {
            default: 'General Settings',
          },
          parameter_info: [
            {
              parameter_ref: 'moduleName',
              label: {
                default: 'Module Name',
              },
              description: {
                default: 'Module Name',
              },
            },
          ],
          action_info: [
            {
              id: 'language',
              label: {
                default: `Select Language (${
                  languages[this.state.editorSettings.language]
                })`,
              },
              control: 'button',
            },
          ],
          group_info: [
            {
              id: 'settings',
              label: {
                default: 'Settings',
              },
              parameter_refs: ['moduleName'],
            },
            {
              id: 'lang',
              label: {
                default: 'Language',
              },
              type: 'actionPanel',
              action_refs: ['language'],
            },
          ],
        },
        conditions: [
          {
            validation: {
              id: 'aqlreserved',
              fail_message: {
                type: 'error',
                focus_parameter_ref: 'moduleName',
                message: {
                  default:
                    'AQL-reserved keywords cannot be used as identifiers',
                },
              },
              evaluate: {
                and: aqlReserved.map((value) => {
                  return {
                    condition: {
                      op: 'notEquals',
                      parameter_ref: 'moduleName',
                      value: value,
                    },
                  };
                }),
              },
            },
          },
          {
            validation: {
              id: 'alphanumeric',
              fail_message: {
                type: 'error',
                focus_parameter_ref: 'moduleName',
                message: {
                  default:
                    'Must only contain alphanumeric characters and underscores',
                },
              },
              evaluate: {
                condition: {
                  op: 'matches',
                  parameter_ref: 'moduleName',
                  value: '^[a-zA-Z0-9_]*$',
                },
              },
            },
          },
          {
            validation: {
              id: 'required',
              fail_message: {
                type: 'error',
                focus_parameter_ref: 'moduleName',
                message: {
                  default: 'This field is required.',
                },
              },
              evaluate: {
                condition: {
                  op: 'isNotEmpty',
                  parameter_ref: 'moduleName',
                },
              },
            },
          },
          {
            validation: {
              id: 'digitFirstCharacter',
              fail_message: {
                type: 'error',
                focus_parameter_ref: 'moduleName',
                message: {
                  default: 'First character cannot be a digit.',
                },
              },
              evaluate: {
                condition: {
                  op: 'matches',
                  parameter_ref: 'moduleName',
                  value: '^[^0-9][a-zA-Z0-9_]*$',
                },
              },
            },
          },
        ],
      },
    };
  }

  getRHSPanel = () => {
    const { selectedNodeId, showSettings } = this.state;
    const { showDocumentViewer } = this.props;
    if (showDocumentViewer) {
      return (
        <Provider store={store}>
          <DocumentViewer />
        </Provider>
      );
    }
    if (showSettings) {
      return (
        <CommonProperties
          ref={(instance) => {
            this.CommonProperties = instance;
          }}
          propertiesConfig={{ containerType: 'Custom', rightFlyout: true }}
          propertiesInfo={this.getPropertiesInfo()} // required
          callbacks={{
            propertyListener: (data) => {
              if (data.action === 'UPDATE_PROPERTY') {
                const newEditorSettings = { ...this.state.editorSettings };
                newEditorSettings[data.property?.name] = data.value;
                this.setState({ editorSettings: newEditorSettings });
              }
            },
            closePropertiesDialog: (closeSource) => {
              console.log(closeSource);
              if (closeSource === 'apply') {
                localStorage.setItem(
                  'nlpEditorSettings',
                  JSON.stringify(this.state.editorSettings),
                );
                this.setCurrentLanguage(this.state.editorSettings.language);
              } else if (closeSource === 'cancel') {
                this.setState({
                  showSettings: false,
                  editorSettings: localStorage.getItem('nlpEditorSettings')
                    ? JSON.parse(localStorage.getItem('nlpEditorSettings'))
                    : {
                        moduleName: DEFAULT_MODULE_NAME,
                        language: DEFAULT_LANGUAGE,
                      },
                });
              }
              this.props.setShowRightPanel({ showPanel: false });
              this.setState({
                showSettings: false,
              });
            },
            actionHandler: (id, appData, data) => {
              switch (id) {
                case 'language':
                  this.setState({ languageSelectModal: true });
                  break;
              }
            },
          }} // required
          light // optional
        ></CommonProperties>
      );
    }
    return (
      <Provider store={store}>
        <RHSPanel
          nodeId={selectedNodeId}
          canvasController={this.canvasController}
          setPayloadDocument={(files) =>
            this.setState({ payloadDocument: files })
          }
        />
      </Provider>
    );
  };

  getlanguageSelectModal = () => {
    if (!this.state.languageSelectModal || this.state.errorMessage) {
      return null;
    }
    return (
      <LanguageModal
        onSubmit={(language) => {
          this.setCurrentLanguage(language);
          const editorSettings = {
            ...this.state.editorSettings,
            language: language,
          };
          this.setState({
            languageSelectModal: false,
            editorSettings: editorSettings,
          });
          localStorage.setItem(
            'nlpEditorSettings',
            JSON.stringify(editorSettings),
          );
        }}
        onRequestClose={() => {
          this.setState({ languageSelectModal: false });
        }}
        languages={languages}
        currentLanguage={this.getCurrentLanguage() ?? DEFAULT_LANGUAGE}
      />
    );
  };

  getErrorModal = () => {
    const { errorMessage, selectedNodeId } = this.state;
    const { nodes } = this.props;
    if (!errorMessage) {
      return null;
    }
    const node = nodes.find((n) => n.nodeId === selectedNodeId);
    const heading = node ? node.label : 'Error';
    return (
      <Modal
        alert={true}
        open={true}
        modalHeading={heading}
        primaryButtonText="OK"
        size="sm"
        onClick={this.onErrorModalClosed}
      >
        <div className="warning-modal">
          <WarningAlt24 aria-label="Warning" className="warning-icon" />
          <span>{errorMessage}</span>
        </div>
      </Modal>
    );
  };

  getTabularView = () => {
    return (
      <Provider store={store}>
        <Close24
          aria-label="Document Viewer"
          className="doc-viewer-close"
          onClick={() => this.setState({ showBottomPanel: false })}
          style={{ position: 'absolute', right: '0', cursor: 'pointer' }}
        />
        <TabularView onRowSelected={this.onRowSelected} />
      </Provider>
    );
  };

  render() {
    const { showRightPanel } = this.props;
    const { isLoading, showBottomPanel } = this.state;
    const rightFlyoutContent = showRightPanel ? this.getRHSPanel() : null;
    const bottomContent = this.getTabularView();
    const toolbarConfig = this.getToolbar();
    const errorModal = this.getErrorModal();
    const languageSelectModal = this.getlanguageSelectModal();

    return (
      <div className="nlp-visual-editor">
        <IntlProvider locale="en">
          <CommonCanvas
            config={{
              enableRightFlyoutUnderToolbar: true,
            }}
            canvasController={this.canvasController}
            rightFlyoutContent={rightFlyoutContent}
            showRightFlyout={showRightPanel}
            clickActionHandler={this.onCanvasAreaClick}
            editActionHandler={this.onEditCanvas}
            toolbarConfig={toolbarConfig}
            showBottomPanel={showBottomPanel}
            bottomPanelContent={bottomContent}
          />
        </IntlProvider>
        {errorModal}
        {languageSelectModal}
        <Loading
          description="Loading NLP results"
          withOverlay={true}
          active={isLoading}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  moduleName: state.nodesReducer.moduleName,
  nodes: state.nodesReducer.nodes,
  pipelineId: state.nodesReducer.pipelineId,
  tabularResults: state.nodesReducer.tabularResults,
  showDocumentViewer: state.nodesReducer.showDocumentViewer,
  showRightPanel: state.nodesReducer.showRightPanel,
  dirty: state.nodesReducer.dirty,
});

const mapDispatchToProps = (dispatch) => ({
  deleteNodes: (ids) => dispatch(deleteNodes(ids)),
  setInputDocument: (document) => dispatch(setInputDocument(document)),
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setNlpNodes: (nodes) => dispatch(setNlpNodes(nodes)),
  setPipelineId: (id) => dispatch(setPipelineId(id)),
  setTabularResults: (data) => dispatch(setTabularResults(data)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
  setShowDocumentViewer: (doShow) => dispatch(setShowDocumentViewer(doShow)),
  setDirty: (dirty) => dispatch(setDirty(dirty)),
  setModuleName: (name) => dispatch(setModuleName(name)),
});

export default connect(mapStateToProps, mapDispatchToProps)(VisualEditor);
