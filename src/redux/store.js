import { configureStore } from '@reduxjs/toolkit';

import nodesReducer from './slice';

export const store = configureStore({
  reducer: {
    nodesReducer,
  },
});
