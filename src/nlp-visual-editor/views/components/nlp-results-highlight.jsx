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
import { createElement } from 'react';

import './nlp-results-highlight.scss';

const NlpResultsHighlight = ({ textToHighlight, spans }) => {
  const textLength = textToHighlight.length;
  const chunks = [];
  let lastIndex = 0;
  spans.forEach((span) => {
    const { start, end, color } = span;
    console.log(span);
    if (lastIndex < start) {
      const text = textToHighlight.substring(lastIndex, start);
      chunks.push({ text, start: lastIndex, end: start, highlight: false });
    }
    const text = textToHighlight.substring(start, end);
    chunks.push({ text, start, end, highlight: true, color });
    lastIndex = end;
  });
  if (lastIndex < textLength) {
    //get the last section after the last span
    const text = textToHighlight.substring(lastIndex, textLength - 1);
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
      const { highlight, text, color } = chunk;
      if (highlight) {
        const props = {
          children: text,
          style: { backgroundColor: color },
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
