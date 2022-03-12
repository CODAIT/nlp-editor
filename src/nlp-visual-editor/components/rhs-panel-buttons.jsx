import React from 'react';
import { Button, ButtonSet } from 'carbon-components-react';

function RHSPanelButtons({ onClosePanel, onSavePanel, showSaveButton = true }) {
  return (
    <>
      {showSaveButton ? (
        <ButtonSet className="rhs-buttons">
          <Button kind="secondary" onClick={onClosePanel}>
            Cancel
          </Button>
          <Button kind="primary" onClick={onSavePanel}>
            Save
          </Button>
        </ButtonSet>
      ) : (
        <Button
          className="rhs-buttons btn-close"
          kind="secondary"
          onClick={onClosePanel}
        >
          Close
        </Button>
      )}
    </>
  );
}

export default RHSPanelButtons;
