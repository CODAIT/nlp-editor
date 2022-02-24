import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import './tabular-view.scss';

import { Tabs, Tab, DataTableSkeleton } from 'carbon-components-react';
import TableResults from './components/table-results';

import { setSelectedRow } from '../../redux/slice';

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

const mapDispatchToProps = (dispatch) => ({
  setSelectedRow: (row) => dispatch(setSelectedRow(row)),
});

export default connect(null, mapDispatchToProps)(TabularView);
