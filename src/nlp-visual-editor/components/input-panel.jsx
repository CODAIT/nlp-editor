import React from 'react';
import {
  Button,
  FileUploader,
  FileUploaderItem,
} from 'carbon-components-react';
import { connect } from 'react-redux';
import axios from 'axios';
import './input-panel.scss';

import { saveNlpNode } from '../../redux/slice';

class InputPanel extends React.Component {
  constructor(props) {
    super(props);
    const { files } = props;
    this.state = { files };
  }

  onFileRemoved = (fileName, evt) => {
    const { files } = this.state;
    const newFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { name } = file;
      if (name != fileName) {
        newFiles.push(file);
      }
    }
    this.setState({ files: newFiles });
  };

  onFilesSelected = (e) => {
    const { files } = e.target;
    this.setState({ files });
  };

  onUploadFiles = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const { files } = this.state;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      formData.append('attach_file', file);
    }

    try {
      const res = await axios.post('/api/upload', formData, {
        headers: {
          accepts: 'text/html',
        },
      });
      this.saveParameters();
    } catch (ex) {
      //TODO handle error
      console.log(ex);
    }
  };

  saveParameters = () => {
    const { saveNlpNode, ...rest } = this.props;
    const { files } = this.state;
    const fileList = Array.from(files);
    const fileNames = fileList.map((f) => {
      return { name: f.name };
    });

    const node = {
      ...rest,
      files: fileNames,
      isValid: true,
    };
    this.props.saveNlpNode({ node });
  };

  getFileUploadList = () => {
    const { isValid } = this.props;
    const fileItems = [];
    const { files } = this.state;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { name } = file;
      fileItems.push(
        <FileUploaderItem
          onDelete={this.onFileRemoved.bind(this, name)}
          size={'sm'}
          status={isValid ? 'complete' : 'edit'}
          name={name}
          key={name}
        />,
      );
    }

    return fileItems;
  };

  render() {
    const { children, isValid } = this.props;
    const { files } = this.state;
    const showFileControl = files.length === 0;
    const fileItems = this.getFileUploadList();
    return (
      <div className="input-panel">
        {showFileControl && (
          <FileUploader
            accept={['.txt', '.htm', '.html']}
            buttonKind="primary"
            buttonLabel="Select files"
            filenameStatus="edit"
            labelDescription="only .txt, .htm, .html files at 500mb or less"
            labelTitle="Upload files"
            size={'sm'}
            multiple={true}
            onChange={this.onFilesSelected}
          />
        )}
        {!showFileControl && (
          <div className="files-selected">
            <label className="bx--file--label">Files to upload</label>
            {fileItems}
            {!isValid && (
              <Button
                kind="primary"
                size="sm"
                className="btn-upload"
                onClick={this.onUploadFiles}
              >
                Upload
              </Button>
            )}
          </div>
        )}
        {children}
      </div>
    );
  }
}

InputPanel.defaultProps = {
  files: [],
};

const mapDispatchToProps = (dispatch) => ({
  saveNlpNode: (node) => dispatch(saveNlpNode(node)),
});

export default connect(null, mapDispatchToProps)(InputPanel);
