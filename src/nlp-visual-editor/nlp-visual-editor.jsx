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
import { CommonCanvas, CanvasController } from '@elyra/canvas';
import { Button, Loading, Modal } from 'carbon-components-react';
import {
  Play32,
  WarningAlt24,
  DocumentDownload32,
  Upload16,
} from '@carbon/icons-react';
import nlpPalette from '../config/nlpPalette.json';
import RHSPanel from './components/rhs-panel';
import TabularView from './views/tabular-view';
import DocumentViewer from './views/document-viewer';

import './nlp-visual-editor.scss';
import { store } from '../redux/store';
import NodeValidator from '../utils/NodeValidator';
import { getImmediateUpstreamNodes } from '../utils';
import JsonToXML from '../utils/JsonToXML';
import { generateNodeName, processNewNode } from '../utils';
import fileDownload from 'js-file-download';

import {
  deleteNodes,
  saveNlpNode,
  setNlpNodes,
  setInputDocument,
  setPipelineId,
  setTabularResults,
  setWorkingId,
  setShowRightPanel,
  setShowDocumentViewer,
} from '../redux/slice';

const TIMER_TICK = 3000; // 3 secs
const TIMER_TRIES = 40; // 2 minutes

class VisualEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      selectedNodeId: undefined,
      enableFlowExecutionBtn: false,
      errorMessage: undefined,
    };

    this.canvasController = new CanvasController();
    this.canvasController.setPipelineFlowPalette(nlpPalette);

    this.nodeValidator = new NodeValidator(this.canvasController);
    this.jsonToXML = new JsonToXML(this.canvasController);
    this.tickCounter = 0;
  }

  componentDidMount() {
    const workingId = shortUUID.generate();
    const id = this.canvasController.getPrimaryPipelineId();
    this.props.setPipelineId({
      pipelineId: id,
    });
    this.props.setWorkingId({ workingId });
  }

  componentDidUpdate = (prevProps) => {
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
  };

  transformToXML = () => {
    const { moduleName, nodes, pipelineId } = this.props;
    const { selectedNodeId } = this.state;
    const payload = [];

    let upstreamNodeIds = this.canvasController
      .getUpstreamNodes([selectedNodeId], pipelineId)
      .nodes[pipelineId].reverse();

	const objNodes = nodes.reduce((sum, curr) => {
		sum[curr.nodeId] = {...{}, ...curr};
		return sum;
	}, {});

    upstreamNodeIds.forEach((id) => {
      	let node = objNodes[id];
      if (node.type !== 'input') {
        const results = this.jsonToXML.transform(node, moduleName);
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
      response = this.nodeValidator.validate(pipelineId, node);
      const { isValid } = response;
      return isValid;
    });
    if (!isValid) {
      const { error } = response;
      this.setState({ errorMessage: error });
    }
    return isValid;
  };

  fetchResults = () => {
    const { workingId } = this.props;
    const url = `/api/results?workingId=${workingId}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
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
        } else if (status === 'success') {
          const { names = [] } = data;
          clearInterval(this.timer);
          let state = { isLoading: false };
          if (names.length === 0) {
            state = {
              ...state,
              errorMessage: 'No matches were found in the input document.',
            };
          }
          this.setState({ ...state });
          this.props.setTabularResults(data);
        } else if (status === 'error') {
          const { message } = data;
          clearInterval(this.timer);
          this.setState({
            isLoading: false,
            errorMessage: message,
          });
        }
      });
  };

  execute = (payload) => {
    const { workingId } = this.props;
    this.setState({ isLoading: true });

    fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workingId,
        payload,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const { document } = data;
        this.props.setInputDocument({ document });
        this.props.setShowDocumentViewer({ showViewer: true });
        //poll for results at specific interval
        this.timer = setInterval(this.fetchResults, TIMER_TICK);
      });
  };

  runPipeline = () => {
    console.time('validating nlp nodes');
    const isValid = this.validatePipeline();
    console.timeEnd('validating nlp nodes');
    if (!isValid) {
      return false;
    }

    this.props.setTabularResults(undefined);

    console.time('transforming nlp nodes to XML');
    const payload = this.transformToXML();
    console.timeEnd('transforming nlp nodes to XML');
    this.execute(payload);
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

  setPipelineFlow = ({ flow, nodes }) => {
    const { primary_pipeline: pipelineId } = flow;
    this.props.setShowRightPanel({ showPanel: false });
    this.props.setTabularResults(undefined); // hides tabular view pane
    this.canvasController.setPipelineFlow(flow);
    this.props.setPipelineId({ pipelineId });
    this.props.setNlpNodes({ nodes });
  };

  onFlowSelected = async (e) => {
    //create a new workingId, treat it as a new session
    const workingId = shortUUID.generate();
    this.props.setWorkingId({ workingId });
    const { files } = e.target;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      formData.append('attach_file', file);
    }
    formData.append('workingId', workingId);
    try {
      const { data } = await axios.post('/api/uploadflow', formData);
      const { flow, nodes } = data;
      if (flow === undefined || nodes === undefined) {
        throw 'File does not conform to the Elyra NLP Tooling schema.';
      }
      this.setPipelineFlow(data);
    } catch (ex) {
      console.log(ex);
      const errorMessage = typeof ex === 'object' ? ex.toString() : ex;
      this.setState({ errorMessage });
    }
  };

  getToolbar = () => {
    const { enableFlowExecutionBtn } = this.state;
    return [
      { action: 'palette', label: 'Palette', enable: true },
      { divider: true },
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
              onClick={this.runPipeline}
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
              onClick={() =>
                window.open(`/api/download/${this.props.pipelineId}`)
              }
            >
              Export
            </Button>
          </>
        ),
      },
    ];
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
		const { newNode } = data;
		clonedNodes.forEach( (newNode) => {
			const node = processNewNode( newNode, nodes );
			this.props.saveNlpNode({
				node
			});	
		});
	} else if (['createNode', 'createAutoNode'].includes(editType)) {
      const { newNode } = data;
	  const node = processNewNode( newNode, nodes );
      this.props.saveNlpNode({
        node
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

  getRHSPanel = () => {
    const { selectedNodeId } = this.state;
    const { showDocumentViewer } = this.props;
    if (showDocumentViewer) {
      return (
        <Provider store={store}>
          <DocumentViewer />
        </Provider>
      );
    }
    return (
      <Provider store={store}>
        <RHSPanel
          nodeId={selectedNodeId}
          canvasController={this.canvasController}
        />
      </Provider>
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
        <TabularView onRowSelected={this.onRowSelected} />
      </Provider>
    );
  };

  render() {
    const { showRightPanel, tabularResults } = this.props;
    const { isLoading } = this.state;
    const rightFlyoutContent = showRightPanel ? this.getRHSPanel() : null;
    const bottomContent = this.getTabularView();
    const toolbarConfig = this.getToolbar();
    const errorModal = this.getErrorModal();

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
            showBottomPanel={tabularResults !== undefined}
            bottomPanelContent={bottomContent}
          />
        </IntlProvider>
        {errorModal}
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
  workingId: state.nodesReducer.workingId,
});

const mapDispatchToProps = (dispatch) => ({
  deleteNodes: (ids) => dispatch(deleteNodes(ids)),
  setInputDocument: (document) => dispatch(setInputDocument(document)),
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setNlpNodes: (nodes) => dispatch(setNlpNodes(nodes)),
  setPipelineId: (id) => dispatch(setPipelineId(id)),
  setTabularResults: (data) => dispatch(setTabularResults(data)),
  setWorkingId: (id) => dispatch(setWorkingId(id)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
  setShowDocumentViewer: (doShow) => dispatch(setShowDocumentViewer(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(VisualEditor);
