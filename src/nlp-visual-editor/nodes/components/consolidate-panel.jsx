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
import React, { Children, isValidElement, cloneElement } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Checkbox, Dropdown, TextArea } from 'carbon-components-react';
import RHSPanelButtons from '../../components/rhs-panel-buttons';

import { getImmediateUpstreamNodes } from '../../../utils';
import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';

class ConsolidatePanel extends React.Component {
  constructor(props) {
    super(props);
    let upstreamNodes = props.upstreamNodes;
    const pipelineLinks = props.canvasController.getLinks(props.pipelineId);
    if (!upstreamNodes) {
      const immediateNodes = getImmediateUpstreamNodes(
        props.nodeId,
        pipelineLinks,
      );
      upstreamNodes = [];
      immediateNodes.forEach((id, index) => {
        const node = props.nodes.find((n) => n.nodeId === id);
        const { label, nodeId, type } = node;
        upstreamNodes.push({ label, nodeId, type });
      });
    }

    this.state = {
      upstreamNodes: upstreamNodes,
      consolidateTarget: this.props.consolidateTarget,
      consolidatePolicy: this.props.consolidatePolicy,
      consolidateMethod: [
        {
          id: 'ContainedWithin',
          text: 'Contained Within',
        },
        {
          id: 'NotContainedWithin',
          text: 'Not Contained Within',
        },
        {
          id: 'ContainsButNotEqual',
          text: 'Contains But Not Equal',
        },
        {
          id: 'ExactMatch',
          text: 'Exact match',
        },
        {
          id: 'LeftToRight',
          text: 'Left To Right',
        },
      ],
    };
  }

  validateParameters = () => {
    const { consolidatePolicy, consolidateTarget } = this.state;
    const { nodeId } = this.props;

    const node = {
      nodeId,
      consolidateTarget,
      consolidatePolicy,
      isValid: true,
    };
    this.props.saveNlpNode({ node });
    this.props.setShowRightPanel({ showPanel: false });
  };

  render() {
    const { pattern } = this.state;
    return (
      <div className="sequence-panel">
        Manage overlapping matches
        <Dropdown
          id="output"
          size="sm"
          light
          label="Output Column"
          initialSelectedItem={this.state.upstreamNodes.find(
            (item) => this.state.consolidateTarget == item.label,
          )}
          items={this.state.upstreamNodes}
          itemToString={(item) => (item ? item.label : '')}
          onChange={(e) => {
            this.setState({
              consolidateTarget: e.selectedItem.label,
            });
          }}
        />
        <Dropdown
          id="method"
          size="sm"
          light
          label="Method"
          initialSelectedItem={this.state.consolidateMethod.find(
            (item) => this.state.consolidatePolicy == item.id,
          )}
          items={this.state.consolidateMethod}
          itemToString={(item) => (item ? item.text : '')}
          onChange={(e) => {
            this.setState({
              consolidatePolicy: e.selectedItem.id,
            });
          }}
        />
        <RHSPanelButtons
          onClosePanel={() => {
            this.props.setShowRightPanel({ showPanel: false });
          }}
          onSavePanel={this.validateParameters}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  nodes: state.nodesReducer.nodes,
  pipelineId: state.nodesReducer.pipelineId,
});

const mapDispatchToProps = (dispatch) => ({
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ConsolidatePanel);
