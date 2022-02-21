import Highlighter from 'react-highlight-words';

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
