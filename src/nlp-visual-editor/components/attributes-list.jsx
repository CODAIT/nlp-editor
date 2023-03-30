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
import { Button, TextInput, Checkbox } from 'carbon-components-react';
import { Edit16 } from '@carbon/icons-react';

export class AttributesList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editIndex: null,
    };
  }

  onSaveAttributeLabel(newLabel, index) {
    let hasError = false;
    if (
      this.props.attributes.find((attribute) => attribute.value === newLabel)
    ) {
      hasError = true;
      this.setState({
        errorMessage: 'Two attributes cannot have the same value.',
      });
    } else {
      this.setState({ errorMessage: undefined });
    }
    const newAttributes = this.props.attributes.map((v, i) => {
      if (index === i) {
        return {
          ...v,
          value: newLabel,
        };
      } else {
        return v;
      }
    });
    this.props.onChange(newAttributes, hasError);
  }

  onSaveAttributeVisible(visible, index) {
    const newAttributes = this.props.attributes.map((v, i) => {
      if (index === i) {
        return {
          ...v,
          visible,
        };
      } else {
        return v;
      }
    });
    this.props.onChange(newAttributes);
  }

  render() {
    const { attributes } = this.props;
    const { errorMessage } = this.state;
    return (
      <div>
        <h4>Attributes</h4>
        {!attributes || attributes.length === 0 ? (
          <span>No attributes available. </span>
        ) : (
          attributes.map((attribute, index) => {
            const { value, visible, label, disabled } = attribute;
            // This returns the editable input
            if (index === this.state.editIndex) {
              return (
                <TextInput
                  id={`textIn-${index}`}
                  key={`textIn-${index}`}
                  invalid={!!errorMessage}
                  invalidText={errorMessage}
                  labelText={`Rename attribute ${label}`}
                  onKeyDown={(e) => {
                    const keyPressed = e.key || e.keyCode;
                    if (this.state.editLabel === '') {
                      return;
                    }
                    if (
                      !errorMessage &&
                      (keyPressed === 'Enter' ||
                        keyPressed === 13 ||
                        keyPressed === 'Escape' ||
                        keyPressed === 27)
                    ) {
                      this.setState({ editIndex: null });
                    }
                  }}
                  onChange={(e) => {
                    this.onSaveAttributeLabel(e.target.value, index);
                  }}
                  defaultValue={value ?? label}
                />
              );
            } else {
              return (
                <div className="attributes" key={`span-${index}`}>
                  <Checkbox
                    id={`check${index}`}
                    labelText=""
                    onChange={(value) =>
                      this.onSaveAttributeVisible(value, index)
                    }
                    disabled={disabled}
                    defaultChecked={visible}
                  />
                  {value ?? label}
                  <Button
                    id={`button-${index}`}
                    renderIcon={Edit16}
                    iconDescription="Edit label"
                    size="sm"
                    hasIconOnly
                    kind="ghost"
                    onClick={() =>
                      this.setState({
                        editIndex: index,
                      })
                    }
                  />
                </div>
              );
            }
          })
        )}
      </div>
    );
  }
}
