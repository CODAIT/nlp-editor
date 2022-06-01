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

export default class FilterNode {
  constructor(canvasController, pipelineId, nodeProps) {
    this.canvasController = canvasController;
    this.pipelineId = pipelineId;
    this.nodeProps = nodeProps;
  }

  validate() {
    //check input ports
    const { nodeId } = this.nodeProps;

    let isCardinalityValid = this.checkCardinality(nodeId);
    if (!isCardinalityValid) {
      return {
        isValid: isCardinalityValid,
        error: 'The filter node does not meet its input requirements.',
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
