import React from 'react';
import { IntlProvider } from 'react-intl';
import { connect, Provider } from 'react-redux';
import shortUUID from 'short-uuid';
import { CommonCanvas, CanvasController } from '@elyra/canvas';
import { Button, Loading, Modal } from 'carbon-components-react';
import { Play32, WarningAlt24 } from '@carbon/icons-react';
import nlpPalette from '../config/nlpPalette.json';
import RHSPanel from './components/rhs-panel';
import TabularView from './views/tabular-view';
import DocumentViewer from './views/document-viewer';

import './nlp-visual-editor.scss';
import { store } from '../redux/store';
import NodeValidator from '../utils/NodeValidator';
import JsonToXML from '../utils/JsonToXML';

import {
  deleteNodes,
  saveNlpNode,
  setInputDocument,
  setPipelineId,
  setTabularResults,
  setWorkingId,
  setShowBottomPanel,
  setShowRightPanel,
  setShowDocumentViewer,
} from '../redux/slice';

const TIMER_TICK = 3000; // 3 secs
const TIMER_TRIES = 20;

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
    this.jsonToXML = new JsonToXML();
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

    upstreamNodeIds.forEach((id) => {
      const node = nodes.find((n) => n.nodeId === id);
      if (node.type !== 'input') {
        const results = this.jsonToXML.transform(node, moduleName);
        if (!Array.isArray(results)) {
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
          //TODO - do nothing, let it run
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
    this.props.setShowBottomPanel({ showPanel: true });
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
    const isValid = this.validatePipeline();
    if (!isValid) {
      return false;
    }

    const payload = this.transformToXML();
    this.execute(payload);
  };

  getToolbar = () => {
    const { enableFlowExecutionBtn } = this.state;
    return [
      { action: 'palette', label: 'Palette', enable: true },
      { divider: true },
      {
        action: 'run',
        tooltip: 'Run NLP rule',
        jsx: (
          <div className="toolbar-run-button">
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
          </div>
        ),
      },
    ];
  };

  onEditCanvas = (data, command) => {
    const { editType, selectedObjectIds } = data;
    if (editType === 'deleteSelectedObjects') {
      this.props.setShowRightPanel({ showPanel: false });
      this.setState({ selectedNodeId: undefined });
      this.props.deleteNodes({ ids: selectedObjectIds });
    } else if (['createNode', 'createAutoNode'].includes(editType)) {
      const { newNode } = data;
      const { id: nodeId, description, label, parameters } = newNode;
      const { type } = parameters;
      this.props.saveNlpNode({
        //set isValid false, we'll check when user opens modal to save values
        node: { label, nodeId, type, description, isValid: false },
      });
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

  onRowSelected = (row, index) => {
    console.log(row);
    this.props.setShowDocumentViewer({ showViewer: true });
    //scroll to selection
    setTimeout(() => {
      const scrollIndex = document.querySelectorAll(
        '.nlp-results-highlight span',
      )[index].offsetTop;
      document.querySelector('.nlp-results-highlight').scrollTop =
        scrollIndex - 200;
    }, 500);
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
    const { label } = node;
    return (
      <Modal
        alert={true}
        open={true}
        modalHeading={label}
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
    const { tabularResults } = this.props;
    if (!tabularResults) {
      return null;
    }

    return (
      <Provider store={store}>
        <TabularView onRowSelected={this.onRowSelected} />
      </Provider>
    );
  };

  render() {
    const { showBottomPanel, showRightPanel } = this.props;
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
            showBottomPanel={showBottomPanel}
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
  showBottomPanel: state.nodesReducer.showBottomPanel,
  showRightPanel: state.nodesReducer.showRightPanel,
  workingId: state.nodesReducer.workingId,
});

const mapDispatchToProps = (dispatch) => ({
  deleteNodes: (ids) => dispatch(deleteNodes(ids)),
  setInputDocument: (document) => dispatch(setInputDocument(document)),
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setPipelineId: (id) => dispatch(setPipelineId(id)),
  setTabularResults: (data) => dispatch(setTabularResults(data)),
  setWorkingId: (id) => dispatch(setWorkingId(id)),
  setShowBottomPanel: (doShow) => dispatch(setShowBottomPanel(doShow)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
  setShowDocumentViewer: (doShow) => dispatch(setShowDocumentViewer(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(VisualEditor);
