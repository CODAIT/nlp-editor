import React from 'react';

import './table-results.scss';

import DataTable, {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from 'carbon-components-react';

const TableResults = ({ tabularData, label, onRowSelected }) => {
  const mockedHeaders = ['Document', `${label} (Span)`];
  return (
    <div className="table-results">
      <Table size="sm">
        <TableHead>
          <TableRow>
            {mockedHeaders.map((header) => (
              <TableHeader id={header} key={header}>
                {header}
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {tabularData.map((row, index) => (
            <TableRow
              key={row.tuple_id}
              onClick={() => onRowSelected(row, index)}
            >
              <TableCell key={row['doc_name'] + index}>
                {row['doc_name']}
              </TableCell>
              <TableCell key={row['fieldName'] + index}>
                {row['fieldName']}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableResults;
