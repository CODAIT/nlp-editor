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
import { TextArea } from 'carbon-components-react';
import { RHSPanelButtons, AttributesList } from '../../components';
import './sequence-panel.scss';

import { getImmediateUpstreamNodes } from '../../../utils';
import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';
class SequencePanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodeId: props.nodeId,
      label: props.label,
      renamed: props.renamed,
      pattern: props.pattern,
      editId: null,
      editLabel: '',
      attributes: props.attributes ?? [],
    };
  }

  componentDidMount() {
    let { pattern } = this.props;
    if (pattern === '') {
      const { pattern, attributes } = this.constructPattern();
      this.setState({
        pattern,
        attributes,
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.nodeId !== prevProps.nodeId) {
      const { label } = this.props;
      const { pattern, attributes } = this.constructPattern();
      this.setState({
        label,
        pattern: this.props.pattern || pattern,
        attributes,
      });
    }
  }

  constructPattern = () => {
    const { canvasController, nodeId, pipelineId, nodes, label } = this.props;
    const pipelineLinks = canvasController.getLinks(pipelineId);
    const immediateNodes = getImmediateUpstreamNodes(nodeId, pipelineLinks);
    let pattern = '';
    const newAttributes = [
      {
        nodeId,
        label,
        visible: true,
        value: this.state.attributes?.[0]?.value ?? label,
        disabled: true,
      },
    ];
    immediateNodes.forEach((id, index) => {
      const node = nodes.find((n) => n.nodeId === id);
      const { label, nodeId, type, visible, attributes } = node;
      pattern += `(<${label}.${attributes?.[0]?.value ?? label}>)`;
      if (index < immediateNodes.length - 1) {
        pattern += `<Token>{1,2}`;
      }
      // Add all attributes from each node (but filter out other node's attributes)
      newAttributes.push({
        label,
        nodeId,
        value: attributes?.[0]?.value ?? label,
        disabled: false,
        visible: true,
      });
    });
    return { pattern, attributes: newAttributes };
  };

  parsePattern = () => {
    const { pattern } = this.state;
    const newList = [];
    const nodeList = pattern.match(/\(<.+?(?=\.)/g);
    if (nodeList) {
      nodeList.forEach((n) => {
        const nodeName = n.substring(2, n.length);
        const { nodeId, type, visible, renamed, attributes } =
          this.props.nodes.find((n) => n.label === nodeName);
        newList.push({
          label: nodeName,
          nodeId,
          type,
          visible,
          renamed,
          attributes,
        });
      });
    }
    return newList;
  };

  getTokens = () => {
    const { pattern } = this.state;
    const tokens = [];
    const tokenList = pattern.match(/<Token.+?(?=\()/g);
    if (tokenList) {
      tokenList.forEach((str) => {
        const strToken = str.match(/\d,\d+/g);
        if (strToken) {
          const [min, max] = strToken[0].split(',');
          tokens.push({ min, max });
        }
      });
    }
    return tokens;
  };

  validateParameters = () => {
    const { pattern, attributes } = this.state;
    const { nodeId } = this.props;

    let errorMessage =
      pattern.length === 0 ? 'You must enter a pattern.' : undefined;

    this.setState({ errorMessage });

    if (!errorMessage) {
      const tokens = this.getTokens();
      const attributes = this.parsePattern();
      const node = {
        nodeId,
        attributes,
        pattern,
        tokens,
        isValid: true,
      };
      this.props.saveNlpNode({ node });
      this.props.setShowRightPanel({ showPanel: false });
    }
  };

  onSaveAttributeLabel(node) {
    const attributeUpdate = {};
    attributeUpdate[node.nodeId] = this.state.editLabel;
    this.setState({
      editId: false,
      attributes: {
        ...this.state.attributes,
        ...attributeUpdate,
      },
    });
  }
  onSaveAttributeVisible(node, value) {
    const attributeUpdate = {};
    attributeUpdate[node.nodeId] = value ? node.label : null;
    this.setState({
      attributes: {
        ...this.state.attributes,
        ...attributeUpdate,
      },
    });
  }

  render() {
    const { pattern, attributes } = this.state;
    return (
      <div className="sequence-panel">
        <TextArea
          id="inputPattern"
          labelText="Sequence pattern"
          size="sm"
          helperText="Ex: (<Division.Division>)<Token>{1,2}(<Metric.Metric>)"
          value={pattern}
          onChange={(e) => {
            this.setState({ pattern: e.target.value });
          }}
        />
        <hr />
        <AttributesList
          attributes={attributes}
          onChange={(newAttributes) => {
            this.setState({ attributes: newAttributes });
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

SequencePanel.propTypes = {
  pattern: PropTypes.string,
};

SequencePanel.defaultProps = {
  pattern: '',
  upstreamNodes: [],
};

const mapStateToProps = (state) => ({
  nodes: state.nodesReducer.nodes,
  pipelineId: state.nodesReducer.pipelineId,
});

const mapDispatchToProps = (dispatch) => ({
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SequencePanel);
