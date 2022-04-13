import { getImmediateUpstreamNodes } from '../../utils';

export default class LiteralNode {
  constructor(canvasController, pipelineId, nodeProps) {
    this.canvasController = canvasController;
    this.pipelineId = pipelineId;
    this.nodeProps = nodeProps;
  }

  validate() {
    //check input ports
    const { isValid, nodeId } = this.nodeProps;

    if (!isValid) {
      return {
        isValid,
        error: 'Literal node missing required parameters.',
      };
    }

    let isCardinalityValid = this.checkCardinality(nodeId);
    if (!isCardinalityValid) {
      return {
        isValid: isCardinalityValid,
        error: 'The literal node does not meet its input requirements.',
      };
    }
    return { isValid: true };
  }

  checkCardinality(nodeId) {
    const inputPorts = this.canvasController.getNodeInputPorts(
      nodeId,
      this.pipelineId,
    );
    const pipelineLinks = this.canvasController.getLinks(this.pipelineId);
    const upstreamNodes = getImmediateUpstreamNodes(nodeId, pipelineLinks);
    const { cardinality } = inputPorts[0];
    const { min } = cardinality;
    return upstreamNodes.length >= min;
  }
}
