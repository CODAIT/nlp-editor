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
import { Button, TextInput, Checkbox } from 'carbon-components-react';
import { Edit16 } from '@carbon/icons-react';
import { RHSPanelButtons } from '../../components';
import classNames from 'classnames';
import { connect } from 'react-redux';
import './literal-panel.scss';
// import './dictionary-panel.scss';

import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';

class LiteralPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      label: props.label,
      inputText: props.inputText,
      lemmaMatch: props.lemmaMatch,
      errorMessage: undefined,
      attributes: props.attributes || {},
      editId: null,
      editLabel: null,
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.nodeId !== prevProps.nodeId) {
      this.setState({
        inputText: this.props.inputText,
        lemmaMatch: this.props.lemmaMatch,
      });
    }
  }

  onChangeLemmaMatch = (value) => {
    this.setState({ lemmaMatch: value });
  };

  onSavePane = () => {
    const errorMessage = this.validateParameters();
    const { lemmaMatch, inputText, attributes } = this.state;
    const { nodeId } = this.props;

    if (!errorMessage) {
      const node = {
        nodeId,
        inputText,
        lemmaMatch,
        attributes,
        isValid: true,
      };
      this.props.saveNlpNode({ node });
      this.props.setShowRightPanel({ showPanel: false });
    }
  };

  validateParameters = () => {
    const { inputText } = this.state;

    const errorMessage =
      inputText.length === 0 ? 'You must enter a string to match.' : undefined;

    this.setState({ errorMessage });
    return errorMessage;
  };

  render() {
    const {
      editId,
      inputText,
      lemmaMatch,
      errorMessage,
      attributes,
      label,
      nodeId,
    } = this.state;
    const literalValue = attributes[0] || label;
    return (
      <div className="literal-panel">
        <div
          className={classNames('input-controls', {
            error: errorMessage !== undefined,
          })}
        >
          <TextInput
            id="inputTextMatch"
            labelText="Value to match in text:"
            type="text"
            size="sm"
            invalid={errorMessage !== undefined}
            invalidText={errorMessage}
            onChange={(e) => {
              this.setState({ inputText: e.target.value });
            }}
            value={inputText}
          />
        </div>
        <Checkbox
          labelText="Lemma Match"
          id="chkLemmaMatch"
          onChange={this.onChangeLemmaMatch}
          checked={lemmaMatch}
        />
        <RHSPanelButtons
          onClosePanel={() => {
            this.props.setShowRightPanel({ showPanel: false });
          }}
          onSavePanel={this.onSavePane}
        />

        <hr />
        <h4>Attributes</h4>

        {nodeId === editId ? (
          <TextInput
            id={`textIn-${nodeId}`}
            key={`textIn-${nodeId}`}
            labelText={`Rename attribute ${label}`}
            onChange={(e) => {
              this.setState({ editLabel: e.target.value });
            }}
            onKeyDown={(e) => {
              const keyPressed = e.key || e.keyCode;
              if (keyPressed === 'Enter' || keyPressed === 13) {
                if (this.state.editLabel === '') {
                  return;
                }
                this.setState({
                  editId: null,
                  attributes: {
                    0: this.state.editLabel,
                  },
                });
              } else if (keyPressed === 'Escape' || keyPressed === 27) {
                this.setState({ editId: null });
              }
            }}
            value={this.state.editLabel}
          />
        ) : (
          <div className="attributes" key={`span-${nodeId}`}>
            <Checkbox
              id={`check${this.state.nodeId}`}
              labelText=""
              disabled
              checked={true}
            />
            {literalValue}
            <Button
              id={`button-${nodeId}`}
              renderIcon={Edit16}
              iconDescription="Edit label"
              size="sm"
              hasIconOnly
              kind="ghost"
              onClick={() =>
                this.setState({
                  editId: nodeId,
                  editLabel: literalValue,
                })
              }
            />
          </div>
        )}
      </div>
    );
  }
}

LiteralPanel.propTypes = {
  nodeId: PropTypes.string.isRequired,
};

LiteralPanel.defaultProps = {
  inputText: '',
  lemmaMatch: false,
};

const mapStateToProps = (state) => ({
  pipelineId: state.nodesReducer.pipelineId,
});

const mapDispatchToProps = (dispatch) => ({
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(LiteralPanel);
