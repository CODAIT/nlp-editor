import { createElement } from 'react';

import './nlp-results-highlight.scss';

const NlpResultsHighlight = ({
  textToHighlight,
  spans,
  highlightClassNames = 'highlight',
}) => {
  const textLength = textToHighlight.length;
  const chunks = [];
  const lastIndex = 0;
  spans.forEach((span) => {
    const { start, end } = span;
    if (lastIndex < start) {
      const text = textToHighlight.substr(lastIndex, span.start);
      chunks.push({ text, start: lastIndex, end: start, highlight: false });
    }
    const text = textToHighlight.substr(span.start, span.end - span.start);
    chunks.push({ text, start, end, highlight: true });
  });
  if (lastIndex < textLength) {
    const text = textToHighlight.substr(lastIndex, textLength - 1);
    chunks.push({
      text,
      start: lastIndex,
      end: textLength - 1,
      highlight: false,
    });
  }

  return createElement('div', {
    className: 'nlp-results-highlight',
    children: chunks.map((chunk, index) => {
      const { highlight, text } = chunk;
      if (highlight) {
        const props = {
          children: text,
          className: highlightClassNames,
          key: index,
        };
        return createElement('span', props);
      }
      return createElement('span', {
        children: text,
        key: index,
      });
    }),
  });
};

export default NlpResultsHighlight;
