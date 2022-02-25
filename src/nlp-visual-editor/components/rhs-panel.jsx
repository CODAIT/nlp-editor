import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, TextInput } from 'carbon-components-react';
import { Edit16 } from '@carbon/icons-react';

import './rhs-panel.scss';
import {
  InputPanel,
  RegexPanel,
  DictionaryPanel,
  SequencePanel,
} from '../nodes/components';

import { saveNlpNode, setShowRightPanel } from '../../redux/slice';

class RHSPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editLabel: false,
      label: null,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.nodeId !== nextProps.nodeId) {
      //chaging panes, reset state
      this.setState({ editLabel: false, label: null });
    }
  }

  getPanelContent(type) {
    const buttons = this.getSaveButton();
    const node = this.getNodeProps();
    const { canvasController } = this.props;
    switch (type) {
      case 'input':
        return <InputPanel {...node} children={buttons} />;
      case 'regex':
        return <RegexPanel {...node} children={buttons} />;
      case 'dictionary':
        return <DictionaryPanel {...node} children={buttons} />;
      case 'sequence':
        return (
          <SequencePanel
            {...node}
            children={buttons}
            canvasController={canvasController}
          />
        );
      default:
        return null;
    }
  }

  getSaveButton = () => {
    return (
      <Button kind="primary" className="rhs-buttons">
        Save
      </Button>
    );
  };

  getTitleComponent = () => {
    const node = this.getNodeProps();
    const { editLabel } = this.state;
    const label = this.state.label === null ? node.label : this.state.label;
    if (!editLabel) {
      return (
        <div className="title">
          <span>{label}</span>
          <Button
            renderIcon={Edit16}
            iconDescription="Edit label"
            size="sm"
            hasIconOnly
            onClick={() => this.setState({ editLabel: true })}
          />
        </div>
      );
    }
    return (
      <TextInput
        id="inputControlLabel"
        labelText="Enter new label"
        hideLabel
        type="text"
        size="sm"
        onChange={(e) => {
          this.setState({ label: e.target.value });
        }}
        onKeyDown={(e) => {
          const keyPressed = e.key || e.keyCode;
          if (keyPressed === 'Enter' || keyPressed === 13) {
            this.onSaveLabel();
          }
        }}
        value={label}
      />
    );
  };

  onSaveLabel = () => {
    const { label } = this.state;
    const { nodeId } = this.props;
    this.setState({ editLabel: false });
    this.props.saveNlpNode({ node: { label, nodeId } });
  };

  getNodeProps = () => {
    const { nodeId, nodes } = this.props;
    return nodes.find((n) => n.nodeId === nodeId);
  };

  render() {
    const node = this.getNodeProps();
    const { description, type } = node;
    const panelContents = this.getPanelContent(type);
    const titleComponent = this.getTitleComponent();

    return (
      <div className="rhs-panel-container">
        <div className="rhs-panel-header">
          {titleComponent}
          <span className="description">{description}</span>
        </div>
        {panelContents}
        <Button
          kind="secondary"
          className="rhs-button-cancel"
          onClick={() => this.props.setShowRightPanel({ showPanel: false })}
        >
          Cancel
        </Button>
      </div>
    );
  }
}

RHSPanel.propTypes = {
  nodeId: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  pipelineId: state.nodesReducer.pipelineId,
  nodes: state.nodesReducer.nodes,
});

const mapDispatchToProps = (dispatch) => ({
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RHSPanel);
