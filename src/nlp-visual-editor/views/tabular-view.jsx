import React from 'react';
import PropTypes from 'prop-types';

import './tabular-view.scss';

import { Tabs, Tab, DataTableSkeleton } from 'carbon-components-react';
import TableResults from './components/table-results';

class TabularView extends React.Component {
  getTableView = () => {
    const { tabularData, label, onRowSelected } = this.props;
    if (!tabularData || tabularData.length === 0) {
      return <DataTableSkeleton showHeader={false} showToolbar={false} />;
    }
    return (
      <Tabs type="container" light={true}>
        <Tab id="idRegex" label={label}>
          <TableResults
            tabularData={tabularData}
            label={label}
            onRowSelected={onRowSelected}
          />
        </Tab>
      </Tabs>
    );
  };

  render() {
    const tableView = this.getTableView();
    return <div className="tabular-view">{tableView}</div>;
  }
}

export default TabularView;
