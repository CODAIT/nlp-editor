import React from 'react';
import { connect } from 'react-redux';

import { SkeletonText } from 'carbon-components-react';
import { Close24, Document24 } from '@carbon/icons-react';
import NlpResultsHighlight from './components/nlp-results-highlight';
import './document-viewer.scss';

import { setShowRightPanel } from '../../redux/slice';

class DocumentViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      textResults: undefined,
    };
  }

  componentDidMount() {
    const { documentName } = this.props;
    const url = `/api/document?name=${documentName}`;

    fetch(url, {
      headers: { 'Content-Type': 'text/html' },
    })
      .then((res) => res.text())
      .then((data) => {
        this.setState({ textResults: data });
      });
  }

  render() {
    const { textResults } = this.state;
    const { documentName, spans } = this.props;
    return (
      <div className="document-viewer">
        {textResults && (
          <>
            <div className="header">
              <Document24
                aria-label="Document Viewer"
                className="doc-viewer-icon"
              />
              <div className="title">Document - {documentName}</div>
              <Close24
                aria-label="Document Viewer"
                className="doc-viewer-close"
                onClick={() =>
                  this.props.setShowRightPanel({ showPanel: false })
                }
              />
            </div>
            <NlpResultsHighlight textToHighlight={textResults} spans={spans} />
          </>
        )}
        {!textResults && <SkeletonText className="skeleton" />}
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
});

export default connect(null, mapDispatchToProps)(DocumentViewer);
