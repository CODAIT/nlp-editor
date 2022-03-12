import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Checkbox, Dropdown } from 'carbon-components-react';
import RHSPanelButtons from '../../components/rhs-panel-buttons';
import './union-panel.scss';

import { getImmediateUpstreamNodes } from '../../../utils';
import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';

class UnionPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      overlapMatches: props.overlapMatches,
      method: props.method,
    };
  }

  componentDidMount() {
    this.setUpstreamNodes();
  }

  componentDidUpdate(prevProps) {
    if (this.props.nodeId !== prevProps.nodeId) {
      const { overlapMatches, method } = this.props;
      this.setUpstreamNodes();
      this.setState({ overlapMatches, method });
    }
  }

  setUpstreamNodes = () => {
    const { canvasController, nodeId, pipelineId, nodes } = this.props;
    const pipelineLinks = canvasController.getLinks(pipelineId);
    const immediateNodes = getImmediateUpstreamNodes(nodeId, pipelineLinks);
    const upstreamNodes = [];
    immediateNodes.forEach((id, index) => {
      const node = nodes.find((n) => n.nodeId === id);
      const { label, nodeId } = node;
      upstreamNodes.push({ label, nodeId });
    });

    //assume it's valid even if user has not interacted with input controls
    const node = {
      nodeId,
      upstreamNodes,
      isValid: true,
    };
    this.props.saveNlpNode({ node });
  };

  onSavePane = () => {
    const { nodeId } = this.props;
    const { ...stateProps } = this.state;
    const node = {
      nodeId,
      ...stateProps,
      isValid: true,
    };
    this.props.saveNlpNode({ node });
    this.props.setShowRightPanel({ showPanel: false });
  };

  getDdlMethodItems = () => {
    return [
      { id: 'ContainedWithin', text: 'Contained Within' },
      { id: 'NotContainedWithin', text: 'Not Contained Within' },
      { id: 'ContainsButNotEqual', text: 'Contains But Not Equal' },
      { id: 'ExactMatch', text: 'Exact Match' },
      { id: 'LeftToRight', text: 'Left to Right' },
    ];
  };

  onMethodSelected = (selectedItem) => {
    const { id } = selectedItem;
    this.setState({ method: id });
  };

  render() {
    const { overlapMatches, method } = this.state;
    const methodItems = this.getDdlMethodItems();
    return (
      <div className="union-panel">
        <Checkbox
          labelText="Overlap matches"
          id="chkOverlapMatches"
          checked={overlapMatches}
          onChange={(checked) => this.setState({ overlapMatches: checked })}
        />
        <Dropdown
          id="ddlMethod"
          titleText="Method"
          label="Method"
          size="sm"
          className="method-drop-down"
          initialSelectedItem={methodItems.find((item) => method == item.id)}
          items={methodItems}
          itemToString={(item) => (item ? item.text : '')}
          disabled={!overlapMatches}
          onChange={({ selectedItem }) => {
            this.onMethodSelected(selectedItem);
          }}
        />
        <RHSPanelButtons
          showSaveButton={false}
          onClosePanel={() => {
            this.props.setShowRightPanel({ showPanel: false });
          }}
        />
      </div>
    );
  }
}

UnionPanel.propTypes = {
  nodeId: PropTypes.string.isRequired,
};

UnionPanel.defaultProps = {
  method: 'ContainedWithin',
  overlapMatches: false,
};

const mapStateToProps = (state) => ({
  nodes: state.nodesReducer.nodes,
  pipelineId: state.nodesReducer.pipelineId,
});

const mapDispatchToProps = (dispatch) => ({
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(UnionPanel);
