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
import {
  InputNode,
  DictionaryNode,
  SequenceNode,
  RegexNode,
  UnionNode,
  LiteralNode,
  FilterNode,
  ConsolidateNode,
} from './validation';

export default function NodeValidator(canvasController) {
  this.canvasController = canvasController;
  this.validate = function (pipelineId, nodeProps, nodes) {
    const { type } = nodeProps;
    let node;
    switch (type) {
      case 'input':
        node = new InputNode(this.canvasController, pipelineId, nodeProps);
        break;
      case 'regex':
        node = new RegexNode(this.canvasController, pipelineId, nodeProps);
        break;
      case 'dictionary':
        node = new DictionaryNode(this.canvasController, pipelineId, nodeProps);
        break;
      case 'sequence':
        node = new SequenceNode(this.canvasController, pipelineId, nodeProps);
        break;
      case 'union':
        node = new UnionNode(
          this.canvasController,
          pipelineId,
          nodeProps,
          nodes,
        );
        break;
      case 'filter':
        node = new FilterNode(this.canvasController, pipelineId, nodeProps);
        break;
      case 'consolidate':
        node = new ConsolidateNode(
          this.canvasController,
          pipelineId,
          nodeProps,
        );
        break;
      case 'literal':
        node = new LiteralNode(this.canvasController, pipelineId, nodeProps);
        break;
    }
    return node.validate();
  };
}
