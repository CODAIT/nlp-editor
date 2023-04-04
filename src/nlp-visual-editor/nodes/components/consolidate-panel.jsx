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
import { connect } from 'react-redux';
import { Dropdown } from 'carbon-components-react';
import { AttributesList, RHSPanelButtons } from '../../components';

import { getImmediateUpstreamNodes } from '../../../utils';
import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';

const consolidateMethod = [
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
];

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
      attributes: this.getAttributes(props.consolidateTarget),
      consolidateTarget: props.consolidateTarget,
      consolidatePolicy: props.consolidatePolicy,
    };
  }

  getAttributes(consolidateTarget) {
    const { nodes } = this.props;
    const primaryNodeInfo = this.state?.consolidateTarget ?? consolidateTarget;
    if (!primaryNodeInfo) {
      return [];
    }
    const primaryNode = nodes.find((n) => n.nodeId === primaryNodeInfo.nodeId);
    return (
      primaryNode?.attributes?.map((attr) => {
        return {
          ...attr,
          disabled: false,
        };
      }) ?? []
    );
  }

  validateParameters = () => {
    const { consolidatePolicy, consolidateTarget, hasAttributesError } =
      this.state;
    const { nodeId } = this.props;

    if (!hasAttributesError) {
      const node = {
        nodeId,
        consolidateTarget,
        consolidatePolicy,
        isValid: true,
      };
      this.props.saveNlpNode({ node });
      this.props.setShowRightPanel({ showPanel: false });
    }
  };

  render() {
    const { attributes, upstreamNodes, consolidateTarget, consolidatePolicy } =
      this.state;
    const nodeOptions = [];
    upstreamNodes.forEach((upstreamNode) => {
      const node = this.props.nodes.find(
        (n) => n.nodeId === upstreamNode.nodeId,
      );
      const { attributes, label, nodeId } = node;
      attributes?.forEach((attribute) => {
        nodeOptions.push({
          nodeId,
          attribute: attribute.value ?? label,
          label,
          text: `<${label}.${attribute.value ?? label}>`,
        });
      });
    });
    return (
      <div className="sequence-panel">
        Manage overlapping matches
        <Dropdown
          id="output"
          size="sm"
          light
          label="Output Column"
          initialSelectedItem={nodeOptions.find(
            (item) => consolidateTarget?.text == item.text,
          )}
          items={nodeOptions}
          itemToString={(item) => (item ? item.text : '')}
          onChange={(e) => {
            this.setState({
              consolidateTarget: e.selectedItem,
              attributes: this.getAttributes(e.selectedItem),
            });
          }}
        />
        <Dropdown
          id="method"
          size="sm"
          light
          label="Method"
          initialSelectedItem={consolidateMethod.find(
            (item) => consolidatePolicy == item.id,
          )}
          items={consolidateMethod}
          itemToString={(item) => (item ? item.text : '')}
          onChange={(e) => {
            this.setState({
              consolidatePolicy: e.selectedItem.id,
            });
          }}
        />
        <AttributesList
          attributes={attributes}
          onChange={(newAttributes, hasError) => {
            this.setState({
              attributes: newAttributes,
              hasAttributesError: hasError,
            });
          }}
          label={this.props.label}
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
