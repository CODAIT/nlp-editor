export default class SequenceNode {
  constructor(canvasController, pipelineId, nodeProps) {
    this.canvasController = canvasController;
    this.pipelineId = pipelineId;
    this.nodeProps = nodeProps;
  }

  validate() {
    const { isValid, nodeId } = this.nodeProps;

    if (!isValid) {
      return {
        isValid,
        error: 'Sequence node missing required parameters.',
      };
    }
    return { isValid: true };
  }
}
