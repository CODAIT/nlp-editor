/*
 *
 * Copyright 2022 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  nodes: [],
  pipelineId: undefined,
  canvasController: undefined,
  errorMessage: undefined,
  tabularResults: undefined,
  inputDocument: undefined,
  moduleName: 'elyraNLPCanvas',
  showRightPanel: false,
  showDocumentViewer: false,
  currentAnnotation: undefined,
  dirty: false,
};

const nodesSlice = createSlice({
  name: 'nlpNodes',
  initialState,
  reducers: {
    setPipelineId: (state, action) => {
      const { pipelineId } = action.payload;
      state.pipelineId = pipelineId;
    },
    setShowRightPanel: (state, action) => {
      const { showPanel } = action.payload;
      state.showRightPanel = showPanel;
    },
    setShowDocumentViewer: (state, action) => {
      const { showViewer } = action.payload;
      state.showDocumentViewer = showViewer;
      if (showViewer) {
        state.showRightPanel = true;
      }
    },
    deleteNodes: (state, action) => {
      const { ids = [] } = action.payload;
      const newNodes = state.nodes.filter((n) => {
        return !ids.includes(n.nodeId);
      });
      state.nodes = newNodes;
      state.dirty = true;
    },
    saveNlpNode: (state, action) => {
      //stores or replaces node.
      const { node } = action.payload;
      const { nodeId } = node;
      //check if exists - should always exists already
      const existingNode = state.nodes.find((n) => n.nodeId === nodeId);
      const updatedNode = { ...existingNode, ...node };
      const nodeList = state.nodes.filter((n) => n.nodeId !== nodeId);
      state.nodes = nodeList.concat(updatedNode);
      state.dirty = true;
    },
    setNlpNodes: (state, action) => {
      // called when saved pipeline json is opened
      const { nodes = [] } = action.payload;
      state.nodes = nodes;
      state.dirty = true;
    },
    setInputDocument: (state, action) => {
      const { document } = action.payload;
      state.inputDocument = document;
    },
    setTabularResults: (state, action) => {
      const { payload } = action;
      if (!payload) {
        state.tabularResults = undefined;
      } else {
        const { annotations, names } = payload;
        state.tabularResults = { annotations, names };
        state.currentAnnotation = names[0];
      }
    },
    setDocumentViewToAnnotation: (state, action) => {
      state.currentAnnotation = action.payload;
    },
    setDirty: (state, action) => {
      state.dirty = action.payload;
    },
    setModuleName: (state, action) => {
      state.moduleName = action.payload;
    },
  },
});

export const {
  deleteNodes,
  saveNlpNode,
  setNlpNodes,
  setInputDocument,
  setTabularResults,
  setPipelineId,
  setShowRightPanel,
  setShowDocumentViewer,
  setDocumentViewToAnnotation,
  setDirty,
  setModuleName,
} = nodesSlice.actions;
export default nodesSlice.reducer;
