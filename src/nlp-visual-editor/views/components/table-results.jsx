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

import './table-results.scss';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'carbon-components-react';

const hasAttributeResult = (tabularData, docName, onRowSelected) => {
  return tabularData.map((row, index) => (
    <TableRow key={`row_${index}`}>
      <TableCell key={`doc-name_${index}`}>{docName}</TableCell>
      {Object.keys(row).map((key) => (
        <TableCell
          onClick={() => onRowSelected({ indexResult: index })}
          key={`row-text_${key}_${index}`}
        >
          {row[key]['text']}
        </TableCell>
      ))}
    </TableRow>
  ));
};

const TableResults = ({ tabularData, label, docName = '', onRowSelected }) => {
  const mockedHeaders = ['Document'];
  Object.keys(tabularData[0]).forEach((key) => {
    mockedHeaders.push(key);
  });
  return (
    <div className="table-results">
      <Table size="sm">
        <TableHead>
          <TableRow>
            {mockedHeaders.map((header, i) => (
              <TableHeader
                id={header}
                key={header}
                title={`${header} ${i == 1 ? `(${tabularData.length})` : ''}`}
              >
                {header} {i == 1 ? `(${tabularData.length})` : ''}
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {hasAttributeResult(tabularData, docName, onRowSelected)}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableResults;
