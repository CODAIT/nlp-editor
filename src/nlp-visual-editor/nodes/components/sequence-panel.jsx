import React, { Children, isValidElement, cloneElement } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { TextArea } from 'carbon-components-react';
import './sequence-panel.scss';

import { getImmediateUpstreamNodes } from '../../../utils';
import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';

class SequencePanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pattern: this.props.pattern,
      upstreamNodes: this.props.upstreamNodes,
    };
  }

  componentDidMount() {
    let { pattern, upstreamNodes } = this.props;
    if (pattern === '') {
      ({ pattern, upstreamNodes } = this.constructPattern());
      this.setState({ pattern, upstreamNodes });
    }
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

  parsePattern = () => {
    const { pattern, upstreamNodes } = this.state;
    const newList = [];
    const nodeList = pattern.match(/\(<.+?(?=\.)/g);
    if (nodeList) {
      nodeList.forEach((n) => {
        const nodeName = n.substring(2, n.length);
        const { nodeId } = upstreamNodes.find((n) => n.label === nodeName);
        newList.push({ label: nodeName, nodeId });
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
    const { pattern } = this.state;
    const { nodeId } = this.props;

    let errorMessage =
      pattern.length === 0 ? 'You must enter a pattern.' : undefined;

    this.setState({ errorMessage });

    if (!errorMessage) {
      const tokens = this.getTokens();
      const upstreamNodes = this.parsePattern();
      const node = {
        nodeId,
        pattern,
        upstreamNodes,
        tokens,
        isValid: true,
      };
      this.props.saveNlpNode({ node });
      this.props.setShowRightPanel({ showPanel: false });
      this.parsePattern();
    }
  };

  render() {
    const children = this.handleChildComponents();
    const { pattern } = this.state;
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
        {children}
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
