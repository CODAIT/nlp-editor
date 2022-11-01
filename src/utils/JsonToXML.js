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
  DictionaryNode,
  RegexNode,
  SequenceNode,
  UnionNode,
  LiteralNode,
  FilterNode,
  ConsolidateNode,
} from './transform';

export default function JsonToXML(canvasController) {
  this.canvasController = canvasController;
  this.transform = function (node, moduleName) {
    const { type } = node;
    let obj;
    switch (type) {
      case 'regex':
        obj = new RegexNode(node, moduleName);
        break;
      case 'dictionary':
        obj = new DictionaryNode(this.canvasController, node, moduleName);
        break;
      case 'sequence':
        obj = new SequenceNode(this.canvasController, node, moduleName);
        break;
      case 'union':
        obj = new UnionNode(node, moduleName);
        break;
      case 'filter':
        obj = new FilterNode(this.canvasController, node, moduleName);
        break;
      case 'consolidate':
        obj = new ConsolidateNode(this.canvasController, node, moduleName);
        break;
      case 'literal':
        obj = new LiteralNode(this.canvasController, node, moduleName);
        break;
    }
    return obj.transform();
  };
}
