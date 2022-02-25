import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  nodes: [],
  pipelineId: undefined,
  canvasController: undefined,
  errorMessage: undefined,
  moduleName: 'elyraNLPCanvas',
  showRightPanel: false,
  showBottomPanel: false,
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
    setShowBottomPanel: (state, action) => {
      const { showPanel } = action.payload;
      state.showBottomPanel = showPanel;
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
    setErrorMessage: (state, action) => {
      const { message } = action.payload;
      state.errorMessage = message;
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
  },
});

export const {
  deleteNodes,
  saveNlpNode,
  setErrorMessage,
  setPipelineId,
  setShowBottomPanel,
  setShowRightPanel,
  setShowDocumentViewer,
} = nodesSlice.actions;
export default nodesSlice.reducer;
