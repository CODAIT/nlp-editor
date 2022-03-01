import React from 'react';
import { connect } from 'react-redux';
import { Information24 } from '@carbon/icons-react';

import './tabular-view.scss';

import { Tabs, Tab } from 'carbon-components-react';
import TableResults from './components/table-results';

class TabularView extends React.Component {
  getInputDocumentName = () => {
    const { nodes } = this.props;
    const node = nodes.find((n) => n.type === 'input') || {};
    const { name } = node.files[0];
    return name;
  };
  getTable = (name) => {
    const { tabularResults, onRowSelected } = this.props;
    const { annotations } = tabularResults;
    const docName = this.getInputDocumentName();
    const data = annotations[name];
    if (data.length === 0) {
      return (
        <div className="no-matches">
          <Information24 aria-label="Information" className="info-icon" />
          <span>No matches found.</span>
        </div>
      );
    }
    return (
      <TableResults
        tabularData={data}
        label={name}
        docName={docName}
        onRowSelected={onRowSelected}
      />
    );
  };

  getTabs = () => {
    const { tabularResults } = this.props;
    const { names } = tabularResults;
    const tabs = [];
    names.forEach((name) => {
      const table = this.getTable(name);
      const tabId = `${name.toLowerCase()}_id`;
      tabs.push(
        <Tab id={tabId} key={tabId} label={name}>
          {table}
        </Tab>,
      );
    });
    return tabs;
  };

  render() {
    const tabs = this.getTabs();
    return (
      <div className="tabular-view">
        <Tabs light={true}>{tabs}</Tabs>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  nodes: state.nodesReducer.nodes,
  tabularResults: state.nodesReducer.tabularResults,
});

export default connect(mapStateToProps, null)(TabularView);
