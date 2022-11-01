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
const js2xmlparser = require('js2xmlparser');
import { store } from '../../redux/store';

export default class SequenceNode {
  constructor(canvasController, node, moduleName) {
    this.canvasController = canvasController;
    this.node = node;
    this.moduleName = moduleName;
  }

  transform() {
    const { label, consolidateTarget, consolidatePolicy } = this.node;
    const { nodes } = store.getState()['nodesReducer'];
    const primaryInput = nodes.find((n) => n.nodeId === this.node.primary);
    const jsonStructure = {
      '@': {
        module: this.moduleName,
        name: label,
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:noNamespaceSchemaLocation': 'schema/target_lang_spec.xsd',
      },
      'input-concepts': {
        'input-concept': [
          {
            '@': {
              module: this.moduleName,
              name: consolidateTarget,
            },
          },
        ],
      },
      rule: {
        'input-spec': {
          'input-span': [
            {
              '@': {
                'input-concept-module': this.moduleName,
                'input-concept-name': consolidateTarget,
                'input-field-name': consolidateTarget,
              },
            },
          ],
        },
        'output-spec': {
          field: [
            {
              '@': {
                name: consolidateTarget,
              },
            },
          ],
        },
        'rule-spec': {
          'concept-projection': {},
        },
      },
      'consolidation-spec': {
        '@': {
          target: consolidateTarget,
          policy: consolidatePolicy,
        },
      },
    };

    const xml = js2xmlparser.parse('concept', jsonStructure, {
      declaration: { encoding: 'UTF-8' },
      format: { doubleQuotes: true },
    });
    return {
      xml,
      label,
    };
  }
}
