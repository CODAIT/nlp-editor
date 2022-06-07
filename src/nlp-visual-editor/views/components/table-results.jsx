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

const hasAttributeResult = (tabularData, docName) => {
	return tabularData.map((row, index) => (
		<TableRow
		  key={`row_${index}`}
		>
		  <TableCell key={`doc-name_${index}`}>{docName}</TableCell>
		  {
		  	Object.keys(row).filter(k => !['attributes', 'indexResult'].includes(k)).map( key => (
			  <TableCell onClick={() => {}} key={`row-text_${key}_${index}`}>{row[key]['text']}</TableCell>
			))
		  }
		</TableRow>
	))
}
const noAttributes = (tabularData, docName) => {
	return tabularData.map((row, index) => (
		<TableRow
		  key={`row_${index}`}
		  onClick={() => {}}
		>
		  <TableCell key={`doc-name_${index}`}>X{docName}</TableCell>
		  <TableCell key={`row-text_${index}`}>{row['text']}</TableCell>
		</TableRow>
	  ));
}

const TableResults = ({ tabularData, label, docName = '', onRowSelected }) => {
  const mockedHeaders = ['Document'];
  let hasAttributtes = false;
  if( tabularData[0].hasOwnProperty('attributes') ) {
	  hasAttributtes = true;
	  Object.keys(tabularData[0]).filter(k => !['attributes', 'indexResult'].includes(k) ).forEach( key => {
		  mockedHeaders.push(key)
	  })
  } else {
	  mockedHeaders.push(`${label} (Span)`);
  }
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
          { !hasAttributtes ? noAttributes(tabularData, docName) : hasAttributeResult(tabularData, docName) }
        </TableBody>
      </Table>
    </div>
  );
};

export default TableResults;
