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
import { getImmediateUpstreamNodes } from '../../utils';

export default class UnionNode {
  constructor(canvasController, pipelineId, nodeProps, nodes) {
    this.canvasController = canvasController;
    this.pipelineId = pipelineId;
    this.nodeProps = nodeProps;
    this.nodes = nodes;
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
    if (this.upstreamHasAttributesAligned()) {
      return {
        isValid: false,
        error: 'The Union upstream nodes require attributes aligned',
      };
    }
    return { isValid: true };
  }

  upstreamHasAttributesAligned() {
    const pipelineLinks = this.canvasController.getLinks(this.pipelineId);
    const upstreamNodes = getImmediateUpstreamNodes(
      this.nodeProps.nodeId,
      pipelineLinks,
    );
    let renamedAttribute = '',
      isInvalidAttributes = false;
    upstreamNodes.forEach((n, i) => {
      const node = this.nodes.find((no) => no.nodeId === n);
      if (!i) {
        renamedAttribute = node.renamed;
        if (node.upstreamNodes.find((uN) => uN.visible)) {
          isInvalidAttributes = true;
        }
      } else if (
        renamedAttribute !== node.renamed ||
        node.upstreamNodes.find((uN) => uN.visible)
      ) {
        isInvalidAttributes = true;
      }
    });
    return isInvalidAttributes;
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
