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
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import RHSPanelButtons from '../../components/rhs-panel-buttons';
import { Information24 } from '@carbon/icons-react';
import './union-panel.scss';

import { getImmediateUpstreamNodes } from '../../../utils';
import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';

class UnionPanel extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.setUpstreamNodes();
  }

  componentDidUpdate(prevProps) {
    if (this.props.nodeId !== prevProps.nodeId) {
      this.setUpstreamNodes();
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

  render() {
    return (
      <div className="union-panel">
        <Information24 aria-label="Information" className="info-icon" />
        <span>No configuration necessary.</span>
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

const mapStateToProps = (state) => ({
  nodes: state.nodesReducer.nodes,
  pipelineId: state.nodesReducer.pipelineId,
});

const mapDispatchToProps = (dispatch) => ({
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(UnionPanel);
