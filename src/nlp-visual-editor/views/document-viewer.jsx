import React from 'react';

import { SkeletonText } from 'carbon-components-react';
import NlpResultsHighlight from './components/nlp-results-highlight';
import './document-viewer.scss';

/*
const spans = [
      { start: 163, end: 171 },
      { start: 1456, end: 1464 },
    ];
*/

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
            <div className="title">Document - {documentName}</div>
            <NlpResultsHighlight textToHighlight={textResults} spans={spans} />
          </>
        )}
        {!textResults && <SkeletonText className="skeleton" />}
      </div>
    );
  }
}

export default DocumentViewer;
