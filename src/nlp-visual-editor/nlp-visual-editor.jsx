import React from 'react';
import { IntlProvider } from 'react-intl';
import { connect, Provider } from 'react-redux';
import { CommonCanvas, CanvasController } from '@elyra/canvas';
import { Button } from 'carbon-components-react';
import { Run32 } from '@carbon/icons-react';
import nlpPalette from '../config/nlpPalette.json';
import RHSPanel from './components/rhs-panel';

import './nlp-visual-editor.scss';
import { store } from '../redux/store';

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
    };

    this.canvasController = new CanvasController();
    this.canvasController.setPipelineFlowPalette(nlpPalette);
  }

  componentDidMount() {
    const id = this.canvasController.getPrimaryPipelineId();
    this.props.setPipelineId({
      pipelineId: id,
    });
  }

  componentDidUpdate = (prevProps) => {
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

  getToolbar = () => {
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
              renderIcon={Run32}
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
      this.props.deleteNodes({ ids: selectedObjectIds });
    } else if (['createNode', 'createAutoNode'].includes(editType)) {
      const { newNode } = data;
      const { id: nodeId, description, label, parameters } = newNode;
      const { type } = parameters;
      this.props.saveNlpNode({ node: { label, nodeId, type, description } });
    }
  };

  onNodeClick = (source) => {
    const { clickType, objectType } = source;

    if (clickType === 'DOUBLE_CLICK') {
      if (objectType === 'node') {
        const { id } = source;
        this.setState({
          selectedNodeId: id,
        });
        this.props.setShowRightPanel({ showPanel: true });
      }
    } else if (clickType === 'SINGLE_CLICK') {
      if (objectType === 'canvas') {
        this.onPanelClose();
      }
    }
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

  render() {
    const { showRightPanel } = this.props;
    const rightFlyoutContent = showRightPanel ? this.getRHSPanel() : null;
    const toolbarConfig = this.getToolbar();

    return (
      <div className="nlp-visual-editor">
        <IntlProvider locale="en">
          <CommonCanvas
            canvasController={this.canvasController}
            rightFlyoutContent={rightFlyoutContent}
            showRightFlyout={showRightPanel}
            clickActionHandler={this.onNodeClick}
            editActionHandler={this.onEditCanvas}
            toolbarConfig={toolbarConfig}
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
