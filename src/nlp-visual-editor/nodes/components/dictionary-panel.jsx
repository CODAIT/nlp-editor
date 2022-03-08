import React, { Children, isValidElement, cloneElement } from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox, Dropdown, TextInput } from 'carbon-components-react';
import { Delete16 } from '@carbon/icons-react';
import classNames from 'classnames';
import { connect } from 'react-redux';

import './dictionary-panel.scss';

import { saveNlpNode, setShowRightPanel } from '../../../redux/slice';

class DictionaryPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputText: '',
      items: props.items,
      caseSensitivity: props.caseSensitivity,
      lemmaMatch: props.lemmaMatch,
      externalResourceChecked: props.externalResourceChecked,
      itemsSelected: [],
      errorMessage: undefined,
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

  getListItems = () => {
    const { items } = this.state;
    const retList = [];
    items.forEach((item) => {
      retList.push(
        <option key={item} value={item}>
          {item}
        </option>,
      );
    });
    return retList;
  };

  getDdlMatchCaseItems = () => {
    return [
      { id: 'match', text: 'Match case' },
      { id: 'ignore', text: 'Ignore case' },
    ];
  };

  onUpdateList = () => {
    const { inputText, items } = this.state;
    this.setState({ items: items.concat(inputText), inputText: '' }, () => {
      this.validateParameters();
    });
  };

  onSelectionChange = (e) => {
    const { options } = e.target;
    const optionList = Array.from(options);
    const selectedList = [];
    optionList.forEach((option) => {
      if (option.selected) {
        selectedList.push(option.value);
      }
    });
    this.setState({ itemsSelected: selectedList });
  };

  onDeleteItems = () => {
    const { items, itemsSelected } = this.state;
    const itemsSet = new Set(items);
    itemsSelected.forEach((item) => {
      itemsSet.delete(item);
    });
    this.setState({ items: Array.from(itemsSet) });
  };

  onChangeCaseSensitivity = ({ selectedItem }) => {
    const { id } = selectedItem;
    this.setState({ caseSensitivity: id });
  };

  onChangeLemmaMatch = (value) => {
    this.setState({ lemmaMatch: value });
  };

  onChangeExternalResource = (value) => {
    this.setState({ externalResourceChecked: value });
  };

  onSavePane = () => {
    const errorMessage = this.validateParameters();
    const { items, caseSensitivity, lemmaMatch, externalResourceChecked } =
      this.state;
    const { nodeId } = this.props;

    if (!errorMessage) {
      const node = {
        nodeId,
        items,
        caseSensitivity,
        lemmaMatch,
        externalResourceChecked,
        isValid: true,
      };
      this.props.saveNlpNode({ node });
      this.props.setShowRightPanel({ showPanel: false });
    }
  };

  validateParameters = () => {
    const { items } = this.state;

    const errorMessage =
      items.length === 0 ? 'You must enter a phrase to match.' : undefined;

    this.setState({ errorMessage });
    return errorMessage;
  };

  handleChildComponents = () => {
    const { children } = this.props;
    const childrenWithProps = Children.map(children, (child) => {
      if (isValidElement(child)) {
        return cloneElement(child, { onClick: this.onSavePane });
      }
      return child;
    });
    return childrenWithProps;
  };

  render() {
    const {
      inputText,
      caseSensitivity,
      externalResourceChecked,
      lemmaMatch,
      errorMessage,
    } = this.state;
    const optionItems = this.getListItems();
    const matchCaseItems = this.getDdlMatchCaseItems();
    const children = this.handleChildComponents();
    return (
      <div className="dictionary-panel">
        <div
          className={classNames('input-controls', {
            error: errorMessage !== undefined,
          })}
        >
          <TextInput
            id="inputTextMatch"
            labelText="Enter phrase to match"
            type="text"
            size="sm"
            invalid={errorMessage !== undefined}
            invalidText={errorMessage}
            onChange={(e) => {
              this.setState({ inputText: e.target.value });
            }}
            onKeyDown={(e) => {
              const keyPressed = e.key || e.keyCode;
              if (keyPressed === 'Enter' || keyPressed === 13) {
                this.onUpdateList();
              }
            }}
            value={inputText}
          />
          <Button
            renderIcon={Delete16}
            iconDescription="Delete row"
            size="sm"
            hasIconOnly
            onClick={this.onDeleteItems}
          />
        </div>
        <select
          name="match-elements"
          multiple
          size="6"
          onChange={this.onSelectionChange}
        >
          {optionItems}
        </select>
        <Dropdown
          id="ddlMatchCase"
          titleText="Case sensitivity"
          label="Dropdown menu options"
          size="sm"
          initialSelectedItem={matchCaseItems.find(
            (item) => caseSensitivity == item.id,
          )}
          items={matchCaseItems}
          itemToString={(matchCaseItems) =>
            matchCaseItems ? matchCaseItems.text : ''
          }
          onChange={this.onChangeCaseSensitivity}
        />
        <Checkbox
          labelText="Lemma Match"
          id="chkLemmaMatch"
          onChange={this.onChangeLemmaMatch}
          checked={lemmaMatch}
        />
        <Checkbox
          labelText="External Resource"
          id="chkExternalResources"
          onChange={this.onChangeExternalResource}
          checked={externalResourceChecked}
        />
        {children}
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
