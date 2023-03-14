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
    this.props.onChange(newAttributes);
    this.setState({
      editIndex: null,
    });
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
    return (
      <div>
        <h4>Attributes</h4>
        {this.props.attributes?.map((attribute, index) => {
          const { value, visible, label, disabled } = attribute;
          // This returns the editable input
          if (index === this.state.editIndex) {
            return (
              <TextInput
                id={`textIn-${index}`}
                key={`textIn-${index}`}
                labelText={`Rename attribute ${label}`}
                onKeyDown={(e) => {
                  const keyPressed = e.key || e.keyCode;
                  if (this.state.editLabel === '') {
                    return;
                  }
                  if (keyPressed === 'Enter' || keyPressed === 13) {
                    this.onSaveAttributeLabel(e.target.value, index);
                  } else if (keyPressed === 'Escape' || keyPressed === 27) {
                    this.setState({ editIndex: null });
                  }
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
                    this.onSaveAttributeVisible(!visible, index)
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
        })}
      </div>
    );
  }
}
