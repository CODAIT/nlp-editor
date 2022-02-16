import React, { Children, isValidElement, cloneElement } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Checkbox,
  Dropdown,
  NumberInput,
  RadioButton,
  RadioButtonGroup,
  TextArea,
  InlineNotification,
} from 'carbon-components-react';

import './regex-panel.scss';
import { saveNlpNode } from '../../redux/slice';

class RegexPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      regexInput: props.regexInput || '',
      expressionType: props.expressionType || 'regular',
      caseSensitivity: props.caseSensitivity || 'match',
      tokenRange: props.tokenRange || {
        checked: false,
        range: [0, 0],
      },
      canonEq: props.canonEq || false,
      dotAll: props.dotAll || false,
      multiline: props.multiline || false,
      unixLines: props.unixLines || false,
      errorMessage: undefined,
    };
  }

  getDdlMatchCaseItems = () => {
    return [
      { id: 'match', text: 'Match case' },
      { id: 'ignore', text: 'Ignore case' },
      { id: 'match-unicode', text: 'Match unicode (ignore case)' },
    ];
  };

  handleChildComponents = () => {
    const { children } = this.props;
    const childrenWithProps = Children.map(children, (child) => {
      if (isValidElement(child)) {
        return cloneElement(child, { onClick: this.validateParameters });
      }
      return child;
    });
    return childrenWithProps;
  };

  validateParameters = () => {
    const { errorMessage, regexInput, ...rest } = this.state;
    const { nodeId } = this.props;
    let err = undefined;
    try {
      new RegExp(regexInput);
    } catch (e) {
      err = 'The expression is not a valid Regex';
    }

    this.setState({ errorMessage: err });

    if (!err) {
      const node = {
        nodeId,
        regexInput,
        ...rest,
        /*regexInput,
        expressionType,
        caseSensitivity,
        tokenRange,
        canonEq,
        dotAll,
        multiline,
        unixLines,*/
      };
      this.props.saveNlpNode({ node });
    }
  };

  render() {
    const matchCaseItems = this.getDdlMatchCaseItems();
    const children = this.handleChildComponents();
    const {
      regexInput,
      expressionType,
      caseSensitivity,
      tokenRange,
      canonEq,
      dotAll,
      multiline,
      unixLines,
      errorMessage,
    } = this.state;
    return (
      <div className="regex-panel">
        {errorMessage && (
          <InlineNotification
            kind="error"
            title="Errors"
            subtitle={errorMessage}
          />
        )}
        <div className="regex-panel-contents">
          <TextArea
            labelText="Enter a regular expression"
            placeholder=""
            helperText="Example: [A-Z][a-z]+(s+[A-Z][a-z]+){0,2} to find one to three capitalized words"
            value={regexInput}
            onChange={(e) => {
              this.setState({ regexInput: e.target.value });
            }}
          />
          <RadioButtonGroup
            legendText="Match expression as"
            name="rdExpression"
            defaultSelected={expressionType}
            onChange={(value) => this.setState({ expressionType: value })}
          >
            <RadioButton
              labelText="Regular expression"
              value="regular"
              id="rd1"
            />
            <RadioButton labelText="Literal text" value="literal" id="rd2" />
          </RadioButtonGroup>
          <Dropdown
            id="ddlMatchCase"
            titleText="Case sensitivity"
            label="Dropdown menu options"
            size="sm"
            initialSelectedItem={matchCaseItems.find(
              (item) => caseSensitivity == item.id,
            )}
            items={matchCaseItems}
            itemToString={(matchCaseItems) =>
              matchCaseItems ? matchCaseItems.text : ''
            }
            onChange={({ selectedItem }) => {
              const { id } = selectedItem;
              this.setState({ caseSensitivity: id });
            }}
          />
          <div className="token-range">
            <Checkbox
              labelText="Token range"
              id="chkTokenRange"
              checked={tokenRange.checked}
              onChange={(checked) =>
                this.setState({ tokenRange: { ...tokenRange, checked } })
              }
            />
            <div className="token-controls">
              <NumberInput
                id="rangeNumFrom"
                min={0}
                max={99}
                value={tokenRange.range[0]}
                size="sm"
                label="tokens from"
                hideLabel
                invalidText="Number is not valid"
                className="number-range"
                disabled={!tokenRange.checked}
                onChange={(e) => {
                  const { range, checked } = tokenRange;
                  this.setState({
                    tokenRange: {
                      checked,
                      range: [e.imaginaryTarget.value, range[1]],
                    },
                  });
                }}
              />
              <span>to</span>
              <NumberInput
                id="rangeNumTo"
                min={0}
                max={99}
                value={tokenRange.range[1]}
                size="sm"
                label="tokens to"
                hideLabel
                invalidText="Number is not valid"
                className="number-range"
                disabled={!tokenRange.checked}
                onChange={(e) => {
                  const { range, checked } = tokenRange;
                  this.setState({
                    tokenRange: {
                      checked,
                      range: [range[0], e.imaginaryTarget.value],
                    },
                  });
                }}
              />
              <span>tokens</span>
            </div>
          </div>
          <div className="chk-series">
            <Checkbox
              labelText="Allow canonical equivalence (CANON_EQ)"
              id="chkCanEq"
              checked={canonEq}
              onChange={(checked) => this.setState({ canonEq: checked })}
            />
            <Checkbox
              labelText="Read line delimiters as characters (DOTALL)"
              id="chkLineDel"
              checked={dotAll}
              onChange={(checked) => this.setState({ dotAll: checked })}
            />
            <Checkbox
              labelText="^ and $ begin and end a line (MULTILINE)"
              id="chkParams"
              checked={multiline}
              onChange={(checked) => this.setState({ multiline: checked })}
            />
            <Checkbox
              labelText="Newline character ( ) ends a line (UNIX_LINES)"
              id="chkNewline"
              checked={unixLines}
              onChange={(checked) => this.setState({ unixLines: checked })}
            />
          </div>
        </div>
        {children}
      </div>
    );
  }
}

RegexPanel.propTypes = {
  nodeId: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  pipelineId: state.nodesReducer.pipelineId,
});

const mapDispatchToProps = (dispatch) => ({
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RegexPanel);
