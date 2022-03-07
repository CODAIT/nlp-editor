import React from 'react';
import { connect } from 'react-redux';
import { Information24 } from '@carbon/icons-react';

import './tabular-view.scss';

import { Tabs, Tab, TabsSkeleton } from 'carbon-components-react';
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
    const { tabularResults, nodes } = this.props;
    const hasFile = nodes.find((n) => n.type === 'input');
    if (hasFile && hasFile.files.length === 0) {
      //user removed the selected file to scan a different file, no tabular results to render
      return null;
    }
    if (!tabularResults) {
      return <TabsSkeleton />;
    }
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
    return <Tabs light={true}>{tabs}</Tabs>;
  };

  render() {
    const tabs = this.getTabs();
    return <div className="tabular-view">{tabs}</div>;
  }
}

const mapStateToProps = (state) => ({
  nodes: state.nodesReducer.nodes,
  tabularResults: state.nodesReducer.tabularResults,
});

export default connect(mapStateToProps, null)(TabularView);
