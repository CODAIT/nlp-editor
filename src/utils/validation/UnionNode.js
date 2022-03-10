import { getImmediateUpstreamNodes } from '../../utils';

export default class UnionNode {
  constructor(canvasController, pipelineId, nodeProps) {
    this.canvasController = canvasController;
    this.pipelineId = pipelineId;
    this.nodeProps = nodeProps;
  }

  validate() {
    const { isValid, nodeId } = this.nodeProps;

    let isCardinalityValid = this.checkCardinality(nodeId);
    if (!isCardinalityValid) {
      return {
        isValid: isCardinalityValid,
        error: 'The Union node does not meet its input requirements.',
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
