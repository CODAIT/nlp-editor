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
import { Button, TextInput } from 'carbon-components-react';
import { Edit16 } from '@carbon/icons-react';

import './rhs-panel.scss';
import {
  InputPanel,
  RegexPanel,
  DictionaryPanel,
  SequencePanel,
  UnionPanel,
  LiteralPanel,
  FilterPanel,
  ConsolidatePanel,
} from '../nodes/components';

import { isNodeLabelValid } from '../../utils';

import {
  saveNlpNode,
  setShowRightPanel,
  setInputDocument,
} from '../../redux/slice';

class RHSPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editLabel: false,
      label: null,
      invalidLabelMessage: undefined,
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.nodeId !== prevProps.nodeId) {
      //chaging panes, reset state
      this.setState({ editLabel: false, label: null });
    }
  }

  getPanelContent(type) {
    const node = this.getNodeProps();
    const { nodeId, canvasController } = this.props;
    const nodeProps = { nodeId, canvasController };
    switch (type) {
      case 'input':
        return (
          <InputPanel
            {...node}
            setPayloadDocument={this.props.setPayloadDocument}
          />
        );
      case 'literal':
        return <LiteralPanel {...node} />;
      case 'regex':
        return <RegexPanel {...node} />;
      case 'filter':
        return <FilterPanel {...node} canvasController={canvasController} />;
      case 'consolidate':
        return (
          <ConsolidatePanel {...node} canvasController={canvasController} />
        );
      case 'dictionary':
        return (
          <DictionaryPanel {...node} canvasController={canvasController} />
        );
      case 'union':
        return <UnionPanel {...nodeProps} />;
      case 'sequence':
        return <SequencePanel {...node} canvasController={canvasController} />;
      default:
        return null;
    }
  }

  getTitleComponent = () => {
    const node = this.getNodeProps();
    const { editLabel, invalidLabelMessage } = this.state;
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
        invalid={invalidLabelMessage !== undefined}
        invalidText={invalidLabelMessage}
        onChange={(e) => {
          this.setState({ label: e.target.value });
        }}
        onBlur={this.onSaveLabel}
        onKeyDown={(e) => {
          const keyPressed = e.key || e.keyCode;
          if (keyPressed === 'Enter' || keyPressed === 13) {
            this.onSaveLabel();
          } else if (keyPressed === 'Escape' || keyPressed === 27) {
            this.setState({ editLabel: false, label: null });
          }
        }}
        value={label}
      />
    );
  };

  onSaveLabel = () => {
    const { label } = this.state;
    const { nodeId, nodes } = this.props;
    const { isValid, message } = isNodeLabelValid(label, nodes);
    if (isValid) {
      this.setState({ editLabel: false, invalidLabelMessage: undefined });
      this.props.saveNlpNode({ node: { label, nodeId } });
    } else {
      this.setState({ invalidLabelMessage: message });
    }
  };

  getNodeProps = () => {
    const { nodeId, nodes } = this.props;
    return nodes.find((n) => n.nodeId === nodeId);
  };

  render() {
    const node = this.getNodeProps();
    if (!node) {
      return <p>Select a node to edit its properties.</p>;
    }
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
