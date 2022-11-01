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
import PropTypes from 'prop-types';
import {
  Button,
  Checkbox,
  FileUploader,
  RadioButton,
  RadioButtonGroup,
  TextInput,
  Toggle,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  TableHeader,
  Table,
  TableSelectRow,
  TableSelectAll,
  TableToolbar,
  TableBatchAction,
  TableBatchActions,
  TableContainer,
  TableToolbarContent,
  DataTable,
} from 'carbon-components-react';
import RHSPanelButtons from '../../components/rhs-panel-buttons';
import { Delete16 } from '@carbon/icons-react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { parse } from 'csv-parse/browser/esm';

import './dictionary-panel.scss';

import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';
import { Pagination } from 'carbon-components-react';

class DictionaryPanel extends React.Component {
  reader = new FileReader();

  constructor(props) {
    super(props);
    const filterItems = (item) => {
      return item !== '';
    };
    const filteredItems = Array.isArray(props.items ?? [])
      ? props.items?.filter(filterItems) ?? []
      : Object.keys(props.items).filter(filterItems);
    this.state = {
      inputText: '',
      items: filteredItems,
      caseSensitivity: props.caseSensitivity,
      lemmaMatch: props.lemmaMatch,
      externalResourceChecked: props.externalResourceChecked,
      itemsSelected: [],
      errorMessage: undefined,
      mapTerms: props.mapTerms ?? false,
      mappedItems: Array.isArray(props.items ?? []) ? {} : props.items,
      page: 1,
      pageSize: 10,
    };
    this.reader.onload = (event) => {
      const { items, mapTerms, mappedItems } = this.state;
      if (mapTerms) {
        parse(event.target.result, {}, (err, records) => {
          if (err) {
            return;
          }
          if (records) {
            const newItems = [];
            const newMapped = {};
            for (const rec of records) {
              if (rec[0] === '') {
                continue;
              }
              if (!items.includes(rec[0])) {
                newItems.push(rec[0]);
              }
              newMapped[rec[0]] = rec[1];
            }
            this.setState({
              items: [...items, ...newItems],
              mappedItems: { ...mappedItems, ...newMapped },
            });
          }
        });
      } else {
        let newItems = event.target.result?.split('\n');
        newItems = newItems.filter((i) => {
          return items.indexOf(i) < 0 && i !== '';
        });
        this.setState({ items: [...items, ...newItems] });
      }
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.nodeId !== prevProps.nodeId) {
      const { items, caseSensitivity, lemmaMatch, externalResourceChecked } =
        this.props;
      this.setState({
        items,
        caseSensitivity,
        lemmaMatch,
        externalResourceChecked,
      });
    }
  }

  onUpdateList = () => {
    const { inputText, items } = this.state;
    this.setState({ items: items.concat(inputText), inputText: '' }, () => {
      this.validateParameters();
    });
  };

  onDeleteItems = (props) => {
    const { items, mappedItems } = this.state;
    const itemsSet = new Set(items);
    const newMapped = { ...mappedItems };
    props.selectedRows.forEach((row) => {
      itemsSet.delete(row.id);
      delete newMapped[row.id];
    });
    this.setState({ items: Array.from(itemsSet), mappedItems: newMapped });
  };

  onChangeLemmaCaseMatch = (value) => {
    if (value === 'caseMatch') {
      this.setState({
        caseSensitivity: 'match',
        lemmaMatch: false,
      });
    } else if (value === 'lemmaMatch') {
      this.setState({
        caseSensitivity: 'ignore',
        lemmaMatch: true,
      });
    } else {
      this.setState({
        caseSensitivity: 'ignore',
        lemmaMatch: false,
      });
    }
  };

  onChangeExternalResource = (value) => {
    this.setState({ externalResourceChecked: value });
  };

  onSavePane = () => {
    const errorMessage = this.validateParameters();
    const {
      items,
      caseSensitivity,
      lemmaMatch,
      externalResourceChecked,
      mapTerms,
      mappedItems,
    } = this.state;
    const { nodeId } = this.props;

    if (!errorMessage) {
      const node = {
        nodeId,
        items: mapTerms ? mappedItems : items,
        caseSensitivity,
        lemmaMatch,
        externalResourceChecked,
        isValid: true,
        mapTerms,
      };
      this.props.saveNlpNode({ node });
      this.props.setShowRightPanel({ showPanel: false });
    }
  };

  getDisplayedItems() {
    const { items, page, pageSize } = this.state;
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return items.slice(start, end);
  }

  validateParameters = () => {
    const { items } = this.state;

    const errorMessage =
      items.length === 0 ? 'You must enter a phrase to match.' : undefined;

    this.setState({ errorMessage });
    return errorMessage;
  };

  onFilesSelected = async (e) => {
    const { files } = e.target;
    for (const file of files) {
      await this.reader.readAsText(file);
    }
  };

  render() {
    const {
      inputText,
      caseSensitivity,
      externalResourceChecked,
      lemmaMatch,
      errorMessage,
      items,
      mapTerms,
      mappedItems,
    } = this.state;
    return (
      <div className="dictionary-panel">
        <FileUploader
          accept={mapTerms ? ['.csv'] : ['.txt']}
          buttonKind="primary"
          buttonLabel="Select files"
          filenameStatus="edit"
          labelDescription={
            mapTerms
              ? 'only .csv files at 10mb or less'
              : 'only .txt files at 10mb or less'
          }
          labelTitle="Upload files"
          size={'sm'}
          onChange={this.onFilesSelected}
        />
        <Toggle
          toggled={mapTerms}
          onToggle={() => {
            this.setState({ mapTerms: !mapTerms });
          }}
          labelText="Map Terms"
        />
        <DataTable
          rows={this.getDisplayedItems().map((item) => {
            if (mapTerms) {
              return {
                id: item,
                value: item,
                mapped: (
                  <TextInput
                    value={mappedItems[item] ?? ''}
                    placeholder="Enter a phrase to map to..."
                    labelText=""
                    onChange={(event) => {
                      const newMapped = Object.assign({}, mappedItems);
                      newMapped[item] = event.target.value;
                      this.setState({ mappedItems: newMapped });
                    }}
                  />
                ),
              };
            } else {
              return {
                id: item,
                value: item,
              };
            }
          })}
          invalid={errorMessage !== undefined}
          invalidText={errorMessage}
          headers={
            mapTerms
              ? [
                  {
                    header: 'Term',
                    key: 'value',
                  },
                  {
                    header: 'Mapped Term',
                    key: 'mapped',
                  },
                ]
              : [
                  {
                    header: 'Term',
                    key: 'value',
                  },
                ]
          }
          render={(props) => {
            return (
              <TableContainer style={{ marginTop: '10px' }}>
                <TableToolbar>
                  <TableBatchActions
                    {...props.getBatchActionProps({
                      totalSelected: this.state.itemsSelected.length,
                    })}
                  >
                    <TableBatchAction
                      onClick={() => {
                        this.onDeleteItems(props);
                      }}
                      renderIcon={Delete16}
                    />
                  </TableBatchActions>
                  <TableToolbarContent style={{ height: 'fit-content' }}>
                    <TextInput
                      value={this.state.inputText}
                      invalid={errorMessage !== undefined}
                      invalidText={errorMessage}
                      placeholder="Enter a phrase to match..."
                      onChange={(event) => {
                        this.setState({ inputText: event.target.value ?? '' });
                      }}
                      onKeyDown={(event) => {
                        const { inputText, items } = this.state;
                        if (
                          event.keyCode === 13 &&
                          inputText !== '' &&
                          !items.includes(inputText)
                        ) {
                          this.setState({
                            items: [...items, this.state.inputText],
                            inputText: '',
                          });
                        }
                      }}
                    />
                    <Button
                      tabIndex={0}
                      onClick={() => {
                        const { items, inputText } = this.state;
                        if (inputText !== '' && !items.includes(inputText)) {
                          this.setState({
                            items: [...items, inputText],
                            inputText: '',
                          });
                        }
                      }}
                      size="small"
                      kind="primary"
                    >
                      Add new
                    </Button>
                  </TableToolbarContent>
                </TableToolbar>
                <Table {...props.getTableProps()}>
                  {mapTerms && (
                    <TableHead>
                      <TableRow key="headerRow">
                        <TableSelectAll {...props.getSelectionProps()} />
                        <TableHeader id="valueHeader" key="valueHeader">
                          Term
                        </TableHeader>
                        <TableHeader id="mappedHeader" key="mappedHeader">
                          Mapped Term
                        </TableHeader>
                      </TableRow>
                    </TableHead>
                  )}
                  <TableBody>
                    {props.rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableSelectRow {...props.getSelectionProps({ row })} />
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            );
          }}
        />
        <Pagination
          page={this.state.page}
          pageSizes={[10, 20, 50]}
          totalItems={this.state.items.length}
          onChange={(data) => {
            this.setState({ page: data.page, pageSize: data.pageSize });
          }}
        />
        <Checkbox
          labelText="External Resource"
          id="chkExternalResources"
          onChange={this.onChangeExternalResource}
          checked={externalResourceChecked}
        />
        <RadioButtonGroup
          id="ddlMatchCase"
          orientation="vertical"
          name="Case sensitivity and Lemma Match"
          legendText="Case sensitivity and Lemma Match"
          onChange={this.onChangeLemmaCaseMatch}
          defaultSelected={
            lemmaMatch
              ? 'lemmaMatch'
              : caseSensitivity === 'match'
              ? 'caseMatch'
              : 'ignoreBoth'
          }
        >
          <RadioButton
            labelText="Ignore case"
            id="ignoreBoth"
            key="ignoreBoth"
            value="ignoreBoth"
          />
          <RadioButton
            labelText="Match case"
            id="caseMatch"
            key="caseMatch"
            value="caseMatch"
          />
          <RadioButton
            labelText="Lemma match"
            id="lemmaMatch"
            key="lemmaMatch"
            value="lemmaMatch"
          />
        </RadioButtonGroup>
        <RHSPanelButtons
          onClosePanel={() => {
            this.props.setShowRightPanel({ showPanel: false });
          }}
          onSavePanel={this.onSavePane}
        />
      </div>
    );
  }
}

DictionaryPanel.propTypes = {
  nodeId: PropTypes.string.isRequired,
};

DictionaryPanel.defaultProps = {
  caseSensitivity: 'match',
  items: [],
  lemmaMatch: false,
  externalResourceChecked: false,
};

const mapStateToProps = (state) => ({
  pipelineId: state.nodesReducer.pipelineId,
});

const mapDispatchToProps = (dispatch) => ({
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(DictionaryPanel);
