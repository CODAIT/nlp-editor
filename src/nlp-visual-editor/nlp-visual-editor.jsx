import React from 'react';
import { IntlProvider } from 'react-intl';
import { connect, Provider } from 'react-redux';
import { CommonCanvas, CanvasController } from '@elyra/canvas';
import { Button } from 'carbon-components-react';
import { Play32 } from '@carbon/icons-react';
import nlpPalette from '../config/nlpPalette.json';
import RHSPanel from './components/rhs-panel';

import './nlp-visual-editor.scss';
import { store } from '../redux/store';
import NodeValidator from '../utils/NodeValidator';
import JsonToXML from '../utils/JsonToXML';

import {
  deleteNodes,
  saveNlpNode,
  setPipelineId,
  setShowRightPanel,
} from '../redux/slice';

class VisualEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedNodeId: '',
      enableFlowExecutionBtn: false,
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

  componentDidUpdate = () => {
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

  validatePipeline = () => {
    const { nodes, pipelineId } = this.props;
    const { selectedNodeId } = this.state;
    const node = nodes.find((n) => n.nodeId === selectedNodeId);
    return this.nodeValidator.validate(pipelineId, node);
  };

  runPipeline = () => {
    const { nodes } = this.props;
    const { selectedNodeId } = this.state;
    const response = this.validatePipeline();
    const { isValid } = response;
    if (!isValid) {
      const { error } = response;
      this.canvasController.setNotificationMessages([
        {
          id: '123',
          type: 'error',
          content: error,
        },
      ]);
      this.canvasController.openNotificationPanel();
    }
    if (isValid) {
      this.canvasController.clearNotificationMessages();
      this.canvasController.closeNotificationPanel();
      const node = nodes.find((n) => n.nodeId === selectedNodeId);
      const xml = this.jsonToXML.transform(node);
      console.log(xml);
    }

    console.log('isValid', response);
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

    if (objectType === 'node') {
      const { id } = source;
      this.setState({ selectedNodeId: id });
      if (clickType === 'DOUBLE_CLICK') {
        //open props panel on double-click to edit node properties
        this.props.setShowRightPanel({ showPanel: true });
      } else if (clickType === 'SINGLE_CLICK') {
        const { enableFlowExecutionBtn } = this.state;
        //enable to run a node
        if (enableFlowExecutionBtn === false) {
          //only set if false, we want to avoid a re-render
          this.setState({ enableFlowExecutionBtn: true });
        }
      }
    } else {
      //if node is not clicked/selected do not enable run button
      this.setState({ enableFlowExecutionBtn: false });
      if (objectType === 'canvas') {
        this.onPanelClose();
      }
    }
    console.log('clickType', clickType);
  };

  onPanelClose = () => {
    this.props.setShowRightPanel({ showPanel: false });
  };

  getRHSPanel = () => {
    const { selectedNodeId } = this.state;
    return (
      <Provider store={store}>
        <RHSPanel
          nodeId={selectedNodeId}
          canvasController={this.canvasController}
        />
      </Provider>
    );
  };

  getNotificationConfig = () => {
    return {
      action: 'notification',
      label: 'Notifications',
      notificationHeader: 'Notification Center',
      notificationSubtitle: 'subtitle',
      enable: true,
      emptyMessage: "You don't have any notifications right now.",
      clearAllMessage: 'Clear all',
      keepOpen: true,
    };
  };

  render() {
    const { showRightPanel } = this.props;
    const rightFlyoutContent = showRightPanel ? this.getRHSPanel() : null;
    const toolbarConfig = this.getToolbar();
    const notificationConfig = this.getNotificationConfig();

    return (
      <div className="nlp-visual-editor">
        <IntlProvider locale="en">
          <CommonCanvas
            canvasController={this.canvasController}
            rightFlyoutContent={rightFlyoutContent}
            showRightFlyout={showRightPanel}
            clickActionHandler={this.onCanvasAreaClick}
            editActionHandler={this.onEditCanvas}
            toolbarConfig={toolbarConfig}
            notificationConfig={notificationConfig}
          />
        </IntlProvider>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  nodes: state.nodesReducer.nodes,
  pipelineId: state.nodesReducer.pipelineId,
  showRightPanel: state.nodesReducer.showRightPanel,
});

const mapDispatchToProps = (dispatch) => ({
  deleteNodes: (ids) => dispatch(deleteNodes(ids)),
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setPipelineId: (data) => dispatch(setPipelineId(data)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(VisualEditor);
