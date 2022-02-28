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

const TableResults = ({ tabularData, label, docName = '', onRowSelected }) => {
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
              key={`row_${index}`}
              onClick={() => onRowSelected(row, index)}
            >
              <TableCell key={`doc-name_${index}`}>{docName}</TableCell>
              <TableCell key={`row-text_${index}`}>{row['text']}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableResults;
