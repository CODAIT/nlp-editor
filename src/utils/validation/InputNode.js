export default class InputNode {
  constructor(canvasController, pipelineId, nodeProps) {
    this.canvasController = canvasController;
    this.pipelineId = pipelineId;
    this.nodeProps = nodeProps;
  }

  validate() {
    const { isValid } = this.nodeProps;
    if (!isValid) {
      return {
        isValid,
        error: 'You must upload a file as input to your rules.',
      };
    }
    return { isValid: true };
  }
}
