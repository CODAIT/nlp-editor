import React, { Children, isValidElement, cloneElement } from 'react';
import { connect } from 'react-redux';
import {
  NumberInput,
  RadioButton,
  RadioButtonGroup,
  TextArea,
} from 'carbon-components-react';
import './sequence-panel.scss';
import { node } from 'prop-types';

class SequencePanel extends React.Component {
  constructPattern = () => {
    const { canvasController, nodeId, pipelineId } = this.props;
    const pipelineNodes = canvasController.getNodes(pipelineId);
    const pipelineLinks = canvasController.getLinks(pipelineId);
    const immediateNodes = this.getImmediateUpstreamNodes(
      nodeId,
      pipelineNodes,
      pipelineLinks,
    );
    console.log(immediateNodes);
  };

  getImmediateUpstreamNodes = (nodeId, nodes, links) => {
    const upstreamLinks = links.filter((l) => l.trgNodeId === nodeId);
    const upstreamNodes = upstreamLinks.map((l) => l.srcNodeId);
    return upstreamNodes;
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

  render() {
    const children = this.handleChildComponents();
    const pattern = this.constructPattern();
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
          value="(<Division.Division>)<Token>{1,2}(<Metric.Metric>)"
        />
        {children}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  pipelineId: state.nodesReducer.pipelineId,
});

export default connect(mapStateToProps, null)(SequencePanel);
