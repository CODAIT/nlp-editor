import Highlighter from 'react-highlight-words';

import './nlp-results-highlight.scss';

const NlpResultsHighlight = ({ data }) => {
  return (
    <div className="nlp-results">
      <Highlighter
        searchWords={['revenue']}
        autoEscape={true}
        textToHighlight={data}
      />
    </div>
  );
};

export default NlpResultsHighlight;
