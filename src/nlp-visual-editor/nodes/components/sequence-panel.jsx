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
      hasAttributesError: false,
      attributes: props.attributes ?? [],
    };
  }

  componentDidMount() {
    const { label } = this.props;
    const { pattern, attributes } = this.constructPattern(this.props.pattern);
    this.setState({
      label,
      pattern,
      attributes,
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.nodeId !== prevProps.nodeId) {
      const { label } = this.props;
      const { pattern, attributes } = this.constructPattern(this.props.pattern);
      this.setState({
        label,
        pattern,
        attributes,
      });
    }
  }

  constructPattern = (currentPattern) => {
    const { canvasController, nodeId, pipelineId, nodes, label } = this.props;
    const pipelineLinks = canvasController.getLinks(pipelineId);
    const immediateNodes = getImmediateUpstreamNodes(nodeId, pipelineLinks);
    let pattern = currentPattern ?? '';
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
      if (currentPattern !== undefined) {
        pattern = pattern.replace(
          new RegExp(`<${label}.(.*?)>`),
          `<${label}.${attributes?.[0]?.value ?? label}>`,
        );
      } else {
        pattern += `(<${label}.${attributes?.[0]?.value ?? label}>)`;
        if (index < immediateNodes.length - 1) {
          pattern += `<Token>{1,2}`;
        }
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
    const { pattern, attributes, label, nodeId } = this.state;
    const newList = [
      attributes?.[0] ?? {
        nodeId,
        label,
        visible: true,
        disabled: true,
      },
    ];
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
    const { pattern, attributes, hasAttributesError } = this.state;
    const { nodeId } = this.props;

    let errorMessage =
      pattern.length === 0 ? 'You must enter a pattern.' : undefined;

    this.setState({ errorMessage });

    if (!errorMessage && !hasAttributesError) {
      const tokens = this.getTokens();
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
