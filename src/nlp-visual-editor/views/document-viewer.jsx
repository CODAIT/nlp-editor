import React from 'react';
import { connect } from 'react-redux';

import { Close24, Document24 } from '@carbon/icons-react';
import NlpResultsHighlight from './components/nlp-results-highlight';
import './document-viewer.scss';

import { setShowRightPanel } from '../../redux/slice';

class DocumentViewer extends React.Component {
  getHighlightColor = (index) => {
    return ['cyan', 'chartreuse', 'gold', 'orangered'][index % 4];
  };

  getHighlightSpans = () => {
    const { tabularResults = {} } = this.props;
    const { annotations, names = [] } = tabularResults;
    let spans = [];
    names.forEach((name, index) => {
      const color = this.getHighlightColor(index);
      const res = annotations[name].map((t) => {
        const { start, end } = t;
        return { start, end, color };
      });
      spans = spans.concat(res);
    });

    return spans.length > 0 ? spans : [];
  };

  getInputDocumentName = () => {
    const { nodes } = this.props;
    const node = nodes.find((n) => n.type === 'input') || {};
    const { name } = node.files[0];
    return name;
  };

  render() {
    const { inputDocument } = this.props;
    const docName = this.getInputDocumentName();
    const spans = this.getHighlightSpans();
    return (
      <div className="document-viewer">
        <>
          <div className="header">
            <Document24
              aria-label="Document Viewer"
              className="doc-viewer-icon"
            />
            <div className="title">Document - {docName}</div>
            <Close24
              aria-label="Document Viewer"
              className="doc-viewer-close"
              onClick={() => this.props.setShowRightPanel({ showPanel: false })}
            />
          </div>
          <NlpResultsHighlight textToHighlight={inputDocument} spans={spans} />
        </>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  inputDocument: state.nodesReducer.inputDocument,
  nodes: state.nodesReducer.nodes,
  tabularResults: state.nodesReducer.tabularResults,
});

const mapDispatchToProps = (dispatch) => ({
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(DocumentViewer);
