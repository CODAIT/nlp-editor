import React from 'react';
import { IntlProvider } from 'react-intl';
import { connect, Provider } from 'react-redux';
import { CommonCanvas, CanvasController } from '@elyra/canvas';
import { Button, Modal } from 'carbon-components-react';
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
  setPipelineId,
  setShowBottomPanel,
  setShowRightPanel,
  setShowDocumentViewer,
} from '../redux/slice';

class VisualEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedNodeId: undefined,
      enableFlowExecutionBtn: false,
      execResults: {
        tabularData: [],
        nodeId: undefined,
      },
      errorMessage: undefined,
      selectedRow: undefined,
    };

    this.canvasController = new CanvasController();
    this.canvasController.setPipelineFlowPalette(nlpPalette);

    this.nodeValidator = new NodeValidator(this.canvasController);
    this.jsonToXML = new JsonToXML();
  }

  componentDidMount() {
    const id = this.canvasController.getPrimaryPipelineId();
    this.props.setPipelineId({
      pipelineId: id,
    });
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

    //check if new row in table was selected, render DocumentViewer
    const { selectedRow } = this.props;
    if (
      selectedRow &&
      prevProps.selectedRow &&
      selectedRow.tuple_id !== prevProps.selectedRow.tuple_id
    ) {
      this.setState({ selectedNodeId: undefined });
    }
  };

  transformToXML = () => {
    const { nodes } = this.props;
    const { selectedNodeId } = this.state;

    ///Transform to XML and make request
    const node = nodes.find((n) => n.nodeId === selectedNodeId);
    return this.jsonToXML.transform(node);
  };

  validatePipeline = () => {
    const { nodes, pipelineId } = this.props;
    const { selectedNodeId } = this.state;
    // clear any previous messages

    const node = nodes.find((n) => n.nodeId === selectedNodeId);
    const response = this.nodeValidator.validate(pipelineId, node);
    const { isValid } = response;
    if (!isValid) {
      const { error } = response;
      this.setState({ errorMessage: error });
    }
    return isValid;
  };

  execute = (xml) => {
    this.props.setShowBottomPanel({ showPanel: true });
    this.setState({ execResults: { tabularData: [] } }); // reset to show table skeleton
    const { selectedNodeId } = this.state;

    setTimeout(() => {
      fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: xml,
      })
        .then((res) => res.json())
        .then((data) => {
          //check if results came back
          this.setState({
            execResults: {
              tabularData: data,
              nodeId: selectedNodeId,
            },
          });
        });
    }, 1000);
  };

  runPipeline = () => {
    const isValid = this.validatePipeline();
    if (!isValid) {
      return false;
    }

    const xml = this.transformToXML();
    this.execute(xml);
    console.log(xml);
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
    let tmpState = {}; //optimize on the following conditionals
    if (objectType === 'node') {
      const { id } = source;
      tmpState = { ...tmpState, selectedNodeId: id };
      if (clickType === 'DOUBLE_CLICK') {
        //open props panel on double-click to edit node properties
        this.props.setShowDocumentViewer({ showViewer: false });
        this.props.setShowRightPanel({ showPanel: true });
      } else if (clickType === 'SINGLE_CLICK') {
        //only set if false, we want to avoid a re-render
        tmpState = { ...tmpState, enableFlowExecutionBtn: true };
      }
      this.setState({ ...tmpState });
    } else {
      //if node is not clicked/selected do not enable run button
      this.setState({ enableFlowExecutionBtn: false });
    }
    console.log('clickType', clickType);
  };

  onErrorModalClosed = () => {
    this.setState({ errorMessage: undefined });
  };

  onRowSelected = (row, index) => {
    this.props.setShowDocumentViewer({ showViewer: true });
    this.setState({ selectedRow: row });
    //scroll to selection
    setTimeout(() => {
      const scrollIndex = document.querySelectorAll(
        '.nlp-results-highlight .highlight',
      )[index].offsetTop;
      document.querySelector('.nlp-results-highlight').scrollTop =
        scrollIndex - 200;
    }, 500);
  };

  getRHSPanel = () => {
    const { selectedNodeId, selectedRow, execResults } = this.state;
    const { showDocumentViewer } = this.props;
    if (showDocumentViewer) {
      const { tabularData } = execResults;
      const spans = tabularData.map((row) => {
        return {
          start: row.tuple_begin,
          end: row.tuple_end,
        };
      });
      const documentName = !selectedRow
        ? tabularData[0].doc_name
        : selectedRow.doc_name;
      return (
        <Provider store={store}>
          <DocumentViewer documentName={documentName} spans={spans} />
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
    const { execResults } = this.state;
    const { tabularData, nodeId } = execResults;
    const { nodes } = this.props;
    const node = nodes.find((n) => n.nodeId === nodeId) || {};
    const { label } = node;

    return (
      <Provider store={store}>
        <TabularView
          tabularData={tabularData}
          label={label}
          onRowSelected={this.onRowSelected}
        />
      </Provider>
    );
  };

  render() {
    const { showBottomPanel, showRightPanel } = this.props;
    const rightFlyoutContent = showRightPanel ? this.getRHSPanel() : null;
    const bottomContent = this.getTabularView();
    const toolbarConfig = this.getToolbar();
    const errorModal = this.getErrorModal();

    return (
      <div className="nlp-visual-editor">
        <IntlProvider locale="en">
          <CommonCanvas
            config={{ enableRightFlyoutUnderToolbar: true }}
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
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  nodes: state.nodesReducer.nodes,
  pipelineId: state.nodesReducer.pipelineId,
  showDocumentViewer: state.nodesReducer.showDocumentViewer,
  showBottomPanel: state.nodesReducer.showBottomPanel,
  showRightPanel: state.nodesReducer.showRightPanel,
});

const mapDispatchToProps = (dispatch) => ({
  deleteNodes: (ids) => dispatch(deleteNodes(ids)),
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setPipelineId: (data) => dispatch(setPipelineId(data)),
  setShowBottomPanel: (doShow) => dispatch(setShowBottomPanel(doShow)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
  setShowDocumentViewer: (doShow) => dispatch(setShowDocumentViewer(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(VisualEditor);
