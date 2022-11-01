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
import { connect } from 'react-redux';

import { Close24, Document24 } from '@carbon/icons-react';
import NlpResultsHighlight from './components/nlp-results-highlight';
import './document-viewer.scss';

import { setShowRightPanel } from '../../redux/slice';

class DocumentViewer extends React.Component {
  getHighlightColor = (index) => {
    return ['#a6c8ff', 'chartreuse', 'gold', 'orangered'][index % 4];
  };

  getHighlightSpans = () => {
    const { tabularResults = {} } = this.props;
    const { annotations, names = [] } = tabularResults;
    let spans = [];

    if (!this.props.documentAnnotation || !annotations) {
      return [];
    }
    const color = this.getHighlightColor(0);
    const res = annotations[this.props.documentAnnotation].map((t) => {
      const outputs = Object.keys(t);
      const { start, end } = t[outputs[0]];
      return { start, end, color };
    });
    spans = spans.concat(res);

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
  documentAnnotation: state.nodesReducer.currentAnnotation,
});

const mapDispatchToProps = (dispatch) => ({
  setShowRightPanel: (doShow) => dispatch(setShowRightPanel(doShow)),
});

export default connect(mapStateToProps, mapDispatchToProps)(DocumentViewer);
