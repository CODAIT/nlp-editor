import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  nodes: [],
  pipelineId: undefined,
  workingId: undefined,
  canvasController: undefined,
  errorMessage: undefined,
  tabularResults: undefined,
  inputDocument: undefined,
  moduleName: 'elyraNLPCanvas',
  showRightPanel: false,
  showDocumentViewer: false,
};

const nodesSlice = createSlice({
  name: 'nlpNodes',
  initialState,
  reducers: {
    setPipelineId: (state, action) => {
      const { pipelineId } = action.payload;
      state.pipelineId = pipelineId;
    },
    setWorkingId: (state, action) => {
      const { workingId } = action.payload;
      state.workingId = workingId;
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
      }
    },
  },
});

export const {
  deleteNodes,
  saveNlpNode,
  setInputDocument,
  setTabularResults,
  setPipelineId,
  setWorkingId,
  setShowRightPanel,
  setShowDocumentViewer,
} = nodesSlice.actions;
export default nodesSlice.reducer;
