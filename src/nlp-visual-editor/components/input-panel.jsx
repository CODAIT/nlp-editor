import React from 'react';
import { FileUploader } from 'carbon-components-react';

class InputPanel extends React.Component {
  onFileUpload = (e) => {
    console.log(e);
  };

  render() {
    const { children } = this.props;
    return (
      <div className="input-panel">
        <FileUploader
          accept={['.txt', '.htm', '.html']}
          buttonKind="primary"
          buttonLabel="Add files"
          filenameStatus="edit"
          labelDescription="only .txt, .htm, .html files at 500mb or less"
          labelTitle="Upload files"
          size="sm"
          onChange={this.onFileUpload}
        />
        {children}
      </div>
    );
  }
}

export default InputPanel;
