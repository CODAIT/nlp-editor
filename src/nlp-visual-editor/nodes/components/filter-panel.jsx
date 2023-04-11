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
import { Dropdown } from 'carbon-components-react';
import { RHSPanelButtons, AttributesList } from '../../components';
import { connect } from 'react-redux';
import { getImmediateUpstreamNodes } from '../../../utils';

// import './dictionary-panel.scss';

import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';

const filterTypeItems = [
  {
    id: 'exclusive-predicates',
    text: 'Exclude',
  },
  {
    id: 'inclusive-predicates',
    text: 'Include',
  },
];

const funcNameItems = [
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
];

const scopeItems = [
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
];

class FilterPanel extends React.Component {
  constructor(props) {
    super(props);
    let upstreamNodes = getImmediateUpstreamNodes(
      this.props.nodeId,
      this.props.canvasController.getLinks(this.props.pipelineId),
    );
    const nodes = this.props.nodes.reduce((sum, curr) => {
      sum[curr.nodeId] = curr;
      return sum;
    }, {});
    this.state = {
      filterType: props.filterType,
      attributes: props.attributes ?? this.getAttributes(props.primary),
      primary: props.primary,
      funcName: props.funcName,
      secondary: props.secondary,
      upstreamNodes,
      scope: props.scope,
    };
  }

  getAttributes(primaryNodeId) {
    const pipelineLinks = this.props.canvasController.getLinks(
      this.props.pipelineId,
    );
    const upstreamNodes = getImmediateUpstreamNodes(
      this.props.nodeId,
      pipelineLinks,
    );
    const primaryNode = this.props.nodes.find(
      (n) => n.nodeId === primaryNodeId ?? upstreamNodes?.[0],
    );
    return (
      primaryNode?.attributes?.map((attr) => {
        return {
          ...attr,
          disabled: false,
        };
      }) ?? []
    );
  }

  onSavePane = () => {
    const {
      primary,
      filterType,
      funcName,
      secondary,
      scope,
      hasAttributesError,
      attributes,
    } = this.state;
    const { nodeId } = this.props;

    if (!hasAttributesError) {
      const node = {
        nodeId,
        primary,
        filterType,
        funcName,
        secondary,
        attributes,
        scope,
        isValid: true,
      };
      this.props.saveNlpNode({ node });
      this.props.setShowRightPanel({ showPanel: false });
    }
  };

  render() {
    const {
      attributes,
      upstreamNodes,
      filterType,
      primary,
      secondary,
      scope,
      funcName,
    } = this.state;
    const nodeOptions = [];
    upstreamNodes.forEach((nodeId) => {
      const node = this.props.nodes.find((n) => n.nodeId === nodeId);
      const { attributes, label } = node;
      attributes?.forEach((attribute) => {
        nodeOptions.push({
          nodeId,
          attribute: attribute.value ?? label,
          label,
          text: `<${label}.${attribute.value ?? label}>`,
        });
      });
    });

    return (
      <div className="literal-panel">
        <Dropdown
          id="filterType"
          size="sm"
          light
          initialSelectedItem={filterTypeItems.find(
            (item) => filterType == item.id,
          )}
          label="Filter"
          items={filterTypeItems}
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
          initialSelectedItem={nodeOptions.find(
            (item) => primary.text == item.text,
          )}
          label="Primary"
          items={nodeOptions}
          itemToString={(item) => (item ? item.text : '')}
          onChange={(e) => {
            this.setState({
              primary: e.selectedItem,
              attributes: this.getAttributes(e.selectedItem.nodeId),
            });
          }}
        />

        <Dropdown
          id="scope"
          size="sm"
          light
          initialSelectedItem={scopeItems.find((item) => scope == item.id)}
          label="Scope"
          items={scopeItems}
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
          initialSelectedItem={funcNameItems.find(
            (item) => funcName == item.id,
          )}
          label="Filter"
          items={funcNameItems}
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
          initialSelectedItem={nodeOptions.find(
            (item) => secondary.text == item.text,
          )}
          label="Secondary"
          items={nodeOptions}
          itemToString={(item) => (item ? item.text : '')}
          onChange={(e) => {
            this.setState({
              secondary: e.selectedItem,
            });
          }}
        />

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
