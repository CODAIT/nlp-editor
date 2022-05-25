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
import React, { Children, isValidElement, cloneElement } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Checkbox, Dropdown, TextArea } from 'carbon-components-react';
import RHSPanelButtons from '../../components/rhs-panel-buttons';
import './sequence-panel.scss';

import { getImmediateUpstreamNodes } from '../../../utils';
import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';

class SequencePanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pattern: this.props.pattern,
      upstreamNodes: this.props.upstreamNodes,
	  consolidate: this.props.consolidate || false,
	  consolidateTarget: this.props.consolidateTarget,
	  consolidatePolicy: this.props.consolidatePolicy,
	  consolidateMethod: [{
		  id: 'ContainedWithin',
		  text: 'Contained Within'
	  }, {
		id: 'NotContainedWithin',
		text: 'Not Contained Within'
	}, {
		id: 'ContainsButNotEqual',
		text: 'Contains But Not Equal'
	}, {
		id: 'Exactmatch',
		text: 'Exact match'
	}, {
		id: 'LeftToRight',
		text: 'Left To Right'
	}]
    };
  }

  componentDidMount() {
    let { pattern, upstreamNodes } = this.props;
    if (pattern === '') {
      ({ pattern, upstreamNodes } = this.constructPattern());
      this.setState({ pattern, upstreamNodes });
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.nodeId !== prevProps.nodeId) {
      const { pattern, upstreamNodes } = this.props;
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
      const { label, nodeId, type } = node;
      pattern += `(<${label}.${label}>)`;
      if (index < immediateNodes.length - 1) {
        pattern += `<Token>{1,2}`;
      }
      upstreamNodes.push({ label, nodeId, type });
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
        const { nodeId, type } = upstreamNodes.find((n) => n.label === nodeName);
        newList.push({ label: nodeName, nodeId, type  });
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
    const { pattern, consolidate, consolidatePolicy, consolidateTarget} = this.state;
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
		consolidate,
		consolidateTarget,
		consolidatePolicy,
        isValid: true,
      };
      this.props.saveNlpNode({ node });
      this.props.setShowRightPanel({ showPanel: false });
    }
  };

  render() {
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

		<hr/>
		<Checkbox
          labelText="Manage overlapping matches"
          id="chkLemmaMatch"
          onChange={(v) => {
			  this.setState({
				  consolidate: v
			  });
		  }}
          checked={this.state.consolidate}
        />

		<Dropdown
			id="output"
			size="sm"
			light
			label="Output Column"
			initialSelectedItem={this.state.upstreamNodes.find(
				(item) => this.state.consolidateTarget == item.label,
			)}
			items={this.state.upstreamNodes}
			itemToString={(item) => (item ? item.label : "")}
			onChange={(e) => {
				this.setState({
					consolidateTarget: e.selectedItem.label
				});
			}}
		/>	

		<Dropdown
			id="method"
			size="sm"
			light
			label="Method"
			initialSelectedItem={this.state.consolidateMethod.find(
				(item) => this.state.consolidatePolicy == item.id,
			)}
			items={this.state.consolidateMethod}
			itemToString={(item) => (item ? item.text : "")}
			onChange={(e) => {
				this.setState({
					consolidatePolicy: e.selectedItem.id
				});
			}}
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
