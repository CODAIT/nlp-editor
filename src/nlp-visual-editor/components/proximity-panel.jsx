import React from 'react';
import {
  NumberInput,
  RadioButton,
  RadioButtonGroup,
} from 'carbon-components-react';
import './proximity-panel.scss';

class ProximityPanel extends React.Component {
  render() {
    return (
      <div className="proximity-panel">
        <RadioButtonGroup
          legendText="Separator"
          name="rdSeparator"
          defaultSelected="rd1"
        >
          <RadioButton labelText="Between" value="rd1" id="rd1" />
          <RadioButton labelText="Exactly" value="rd2" id="rd2" />
        </RadioButtonGroup>
        <div className="token-controls">
          <NumberInput
            id="rangeNumFrom"
            min={0}
            max={99}
            value={0}
            size="sm"
            label="tokens from"
            hideLabel
            invalidText="Number is not valid"
            className="number-range"
          />
          <span>to</span>
          <NumberInput
            id="rangeNumTo"
            min={0}
            max={99}
            value={0}
            size="sm"
            label="tokens to"
            hideLabel
            invalidText="Number is not valid"
            className="number-range"
          />
          <span>tokens</span>
        </div>
      </div>
    );
  }
}

export default ProximityPanel;
