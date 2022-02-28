import React from 'react';
import PropTypes from 'prop-types';

import './tabular-view.scss';

import { Tabs, Tab, DataTableSkeleton } from 'carbon-components-react';
import TableResults from './components/table-results';

class TabularView extends React.Component {
  getTable = (name) => {
    const { annotations = {}, docName, onRowSelected } = this.props;
    const data = annotations[name];
    if (data.length === 0) {
      return <DataTableSkeleton showHeader={false} showToolbar={false} />;
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
    const { names } = this.props;
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

export default TabularView;
