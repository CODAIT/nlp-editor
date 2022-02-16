import React from 'react';
import { Provider } from 'react-redux';
import { Header, HeaderName } from 'carbon-components-react';
import VisualEditor from './nlp-visual-editor';

import { store } from './redux/store';

const App = () => (
  <Provider store={store}>
    <Header aria-label="Elyra Open Source">
      <HeaderName href="#" prefix="Elyra">
        Visual Editor for NLP rules
      </HeaderName>
    </Header>
    <VisualEditor />
  </Provider>
);

export default App;
