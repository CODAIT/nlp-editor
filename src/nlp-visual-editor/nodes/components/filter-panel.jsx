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
import { Checkbox, TextInput, Dropdown } from 'carbon-components-react';
import RHSPanelButtons from '../../components/rhs-panel-buttons';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { getImmediateUpstreamNodes } from '../../../utils';

// import './dictionary-panel.scss';

import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';

class FilterPanel extends React.Component {
  constructor(props) {
    super(props);
    let upstream = getImmediateUpstreamNodes(
      this.props.nodeId,
      this.props.canvasController.getLinks(this.props.pipelineId),
    );
    const nodes = this.props.nodes.reduce((sum, curr) => {
      sum[curr.nodeId] = curr;
      return sum;
    }, {});
    upstream = upstream.map((u) => ({ id: u, text: nodes[u].label }));
    this.state = {
      filterType: props.filterType,
      filterTypeItems: [
        {
          id: 'exclusive-predicates',
          text: 'Exclude',
        },
        {
          id: 'inclusive-predicates',
          text: 'Include',
        },
      ],
      primary: props.primary,
      funcName: props.funcName,
      funcNameItems: [
        {
          id: '',
          text: 'equals',
        },
        {
          id: 'Contains',
          text: 'contains',
        },
        {
          id: '',
          text: 'starts with',
        },
        {
          id: '',
          text: 'ends with',
        },
        {
          id: 'Overlaps',
          text: 'overlaps with',
        },
        {
          id: '',
          text: 'occurs before',
        },
        {
          id: '',
          text: 'occurs after',
        },
      ],
      secondary: props.secondary,
      upstream: upstream,
      scope: props.scope,
      scopeItems: [
        {
          id: 'length',
          text: 'length',
        },
        {
          id: 'text',
          text: 'text',
        },
        {
          id: 'span',
          text: 'span',
        },
      ],
    };
  }

  componentDidUpdate(prevProps) {}

  onSavePane = () => {
    const { primary, filterType, funcName, secondary, scope } = this.state;
    const { nodeId } = this.props;

    const node = {
      nodeId,
      primary,
      filterType,
      funcName,
      secondary,
      scope,
      isValid: true,
    };
    this.props.saveNlpNode({ node });
    this.props.setShowRightPanel({ showPanel: false });
  };

  render() {
    const { inputText, lemmaMatch, errorMessage, attributes } = this.state;

    return (
      <div className="literal-panel">
        <Dropdown
          id="filterType"
          size="sm"
          light
          initialSelectedItem={this.state.filterTypeItems.find(
            (item) => this.state.filterType == item.id,
          )}
          label="Filter"
          items={this.state.filterTypeItems}
          itemToString={(item) => (item ? item.text : '')}
          onChange={(e) => {
            this.setState({
              filterType: e.selectedItem.id,
            });
          }}
        />

        <Dropdown
          id="primary"
          size="sm"
          light
          initialSelectedItem={this.state.upstream.find(
            (item) => this.state.primary == item.id,
          )}
          label="Primary"
          items={this.state.upstream}
          itemToString={(item) => (item ? item.text : '')}
          onChange={(e) => {
            this.setState({
              primary: e.selectedItem.id,
            });
          }}
        />

        <Dropdown
          id="scope"
          size="sm"
          light
          initialSelectedItem={this.state.scopeItems.find(
            (item) => this.state.scope == item.id,
          )}
          label="Scope"
          items={this.state.scopeItems}
          itemToString={(item) => (item ? item.text : '')}
          onChange={(e) => {
            this.setState({
              scope: e.selectedItem.id,
            });
          }}
        />

        <Dropdown
          id="funcName"
          size="sm"
          light
          initialSelectedItem={this.state.funcNameItems.find(
            (item) => this.state.funcName == item.id,
          )}
          label="Filter"
          items={this.state.funcNameItems}
          itemToString={(item) => (item ? item.text : '')}
          onChange={(e) => {
            this.setState({
              funcName: e.selectedItem.id,
            });
          }}
        />

        <Dropdown
          id="secondary"
          size="sm"
          light
          initialSelectedItem={this.state.upstream.find(
            (item) => this.state.secondary == item.id,
          )}
          label="Secondary"
          items={this.state.upstream}
          itemToString={(item) => (item ? item.text : '')}
          onChange={(e) => {
            this.setState({
              secondary: e.selectedItem.id,
            });
          }}
        />

        <RHSPanelButtons
          onClosePanel={() => {
            this.props.setShowRightPanel({ showPanel: false });
          }}
          onSavePanel={this.onSavePane}
        />
      </div>
    );
  }
}

FilterPanel.propTypes = {
  nodeId: PropTypes.string.isRequired,
};

FilterPanel.defaultProps = {
  filterType: 'exclusive-predicates',
  funcName: '',
  primary: '',
  secondary: '',
};

const mapStateToProps = (state) => ({
  pipelineId: state.nodesReducer.pipelineId,
  nodes: state.nodesReducer.nodes,
});

const mapDispatchToProps = (dispatch) => ({
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(FilterPanel);
