import React, { Children, isValidElement, cloneElement } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  NumberInput,
  RadioButton,
  RadioButtonGroup,
  TextArea,
} from 'carbon-components-react';
import './sequence-panel.scss';

import { getImmediateUpstreamNodes } from '../../utils';
import { saveNlpNode } from '../../redux/slice';

class SequencePanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pattern: '',
      upstreamNodes: [],
    };
  }

  componentDidMount() {
    const { pattern, upstreamNodes } = this.constructPattern();
    this.setState({ pattern, upstreamNodes });
  }

  constructPattern = () => {
    const { canvasController, nodeId, pipelineId, nodes } = this.props;
    const pipelineLinks = canvasController.getLinks(pipelineId);
    const immediateNodes = getImmediateUpstreamNodes(nodeId, pipelineLinks);
    let pattern = '';
    const upstreamNodes = [];
    immediateNodes.forEach((id, index) => {
      const node = nodes.find((n) => n.nodeId === id);
      const { label, nodeId } = node;
      pattern += `(<${label}.${label}>)`;
      if (index < immediateNodes.length - 1) {
        pattern += `<Token>{1,2}`;
      }
      upstreamNodes.push({ label, nodeId });
    });
    return { pattern, upstreamNodes };
  };

  getTokens = () => {
    const { pattern } = this.state;
    const tokens = [];
    const tokenList = pattern.match(/<Token.+?(?=\()/g);
    if (tokenList) {
      tokenList.forEach((str) => {
        const strToken = str.match(/\d,\d/g);
        if (strToken) {
          const [min, max] = strToken[0].split(',');
          tokens.push({ min, max });
        }
      });
    }
    return tokens;
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
    const { pattern, upstreamNodes } = this.state;
    const { nodeId } = this.props;

    let errorMessage =
      pattern.length === 0 ? 'You must enter a pattern.' : undefined;

    this.setState({ errorMessage });

    if (!errorMessage) {
      const tokens = this.getTokens();
      const node = {
        nodeId,
        pattern,
        upstreamNodes,
        tokens,
        isValid: true,
      };
      this.props.saveNlpNode({ node });
    }
  };

  render() {
    const children = this.handleChildComponents();
    const { pattern } = this.state;
    return (
      <div className="sequence-panel">
        <div className="sequence-token">
          {/*<RadioButtonGroup
            legendText="Separator"
            name="rdSeparator"
            defaultSelected="rd1"
          >
            <RadioButton labelText="Between" value="rd1" id="rd1" />
            <RadioButton labelText="Exactly" value="rd2" id="rd2" />
          </RadioButtonGroup>
          <div className="token-controls">
            <NumberInput
              id="rangeNumFrom"
              min={0}
              max={99}
              value={0}
              size="sm"
              label="tokens from"
              hideLabel
              invalidText="Number is not valid"
              className="number-range"
            />
            <span>to</span>
            <NumberInput
              id="rangeNumTo"
              min={0}
              max={99}
              value={0}
              size="sm"
              label="tokens to"
              hideLabel
              invalidText="Number is not valid"
              className="number-range"
            />
            <span>tokens</span>
          </div>*/}
        </div>
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
        {children}
      </div>
    );
  }
}

SequencePanel.propTypes = {
  pattern: PropTypes.string,
};

const mapStateToProps = (state) => ({
  nodes: state.nodesReducer.nodes,
  pipelineId: state.nodesReducer.pipelineId,
});

const mapDispatchToProps = (dispatch) => ({
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SequencePanel);
