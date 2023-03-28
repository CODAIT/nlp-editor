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

import { AttributesList, RHSPanelButtons } from '../../components';
import { Information24 } from '@carbon/icons-react';
import './union-panel.scss';

import { getImmediateUpstreamNodes } from '../../../utils';
import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';

class UnionPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      attributes: props.attributes,
      mismatchedAttributes: false,
    };
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
    if (this.state.attributes) {
      return;
    }
    const { canvasController, nodeId, pipelineId, nodes } = this.props;
    const pipelineLinks = canvasController.getLinks(pipelineId);
    const immediateNodes = getImmediateUpstreamNodes(nodeId, pipelineLinks);
    // Explanation of attributes:
    // The union can only be created if the input nodes have the same schema:
    // Same number of attributes and same names for attributes.
    const firstImmediateNode = nodes.find(
      (n) => n.nodeId === immediateNodes?.[0],
    );
    const attributeValues = JSON.stringify(
      firstImmediateNode?.attributes
        ?.filter((attribute) => attribute.visible)
        .map((attribute) => attribute.value)
        ?.sort(),
    );
    let attributesMatch = true;
    // Check if each node has the same number of attributes and all match
    for (const id of immediateNodes) {
      const node = nodes.find((n) => n.nodeId === id);
      const attributes = node?.attributes
        ?.filter((attribute) => attribute.visible)
        .map((attribute) => attribute.value)
        ?.sort();
      if (!attributes) {
        attributesMatch = false;
        break;
      }
      if (JSON.stringify(attributes) !== attributeValues) {
        attributesMatch = false;
        break;
      }
    }
    if (attributesMatch) {
      //assume it's valid even if user has not interacted with input controls
      const node = {
        nodeId,
        attributes: firstImmediateNode?.attributes,
        isValid: true,
      };
      this.props.saveNlpNode({ node });
      this.setState({ attributes: firstImmediateNode?.attributes });
    } else {
      this.setState({ mismatchedAttributes: true });
    }
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
    const { attributes, mismatchedAttributes } = this.state;
    return (
      <div className="union-panel">
        {mismatchedAttributes ? (
          <span>Upstream nodes must have the same attributes. </span>
        ) : (
          <AttributesList
            attributes={attributes ?? []}
            onChange={(newAttributes) => {
              this.setState({ attributes: newAttributes });
            }}
            label={this.props.label}
          />
        )}
        <RHSPanelButtons
          showSaveButton={true}
          onSavePanel={this.onSavePane}
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
