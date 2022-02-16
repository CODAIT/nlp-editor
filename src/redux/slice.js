import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  nodes: [],
  pipelineId: undefined,
  canvasController: undefined,
  showRightPanel: false,
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
  },
});

export const { deleteNodes, saveNlpNode, setPipelineId, setShowRightPanel } =
  nodesSlice.actions;
export default nodesSlice.reducer;
