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
