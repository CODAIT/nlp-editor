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

export default class UnionNode {
  constructor(node, moduleName) {
    this.node = node;
    this.moduleName = moduleName;
  }

  getChildUpstreamNodes = (nodeId) => {
    const { nodes } = store.getState()['nodesReducer'];
    const node = nodes.find((n) => n.nodeId === nodeId);
    const { upstreamNodes = [] } = node;
    return upstreamNodes;
  };

  getInputSpans = (childNode) => {
    const { label: parentNodeLabel } = this.node; //union-node label
    const { label, nodeId } = childNode;
    const upstreamNodes = this.getChildUpstreamNodes(nodeId);
    const spans = [
      {
        '@': {
          'input-concept-module': this.moduleName,
          'input-concept-name': label,
          'input-field-name': label, //'Literal_1',
        },
      },
    ]; //add the first field for the sequence node
    /*upstreamNodes.forEach((node, index) => {
      spans.push({
        '@': {
          'input-concept-module': this.moduleName,
          'input-concept-name': label,
          'input-field-name': node.label,
        },
      });
    });*/
    return spans;
  };

  getRules() {
    const { upstreamNodes, label } = this.node;
    const { nodes } = store.getState()['nodesReducer'];
    const rules = [];
    upstreamNodes.forEach((n) => {
      const inputSpans = this.getInputSpans(n);
      const node = nodes.find((node) => node.nodeId === n.nodeId);
      rules.push({
        'input-spec': {
          'input-span': inputSpans,
        },
        'output-spec': {
          field: {
            '@': {
              name: node.renamed, //"Literal_1",
              hide: 'no',
              'func-call': 'no',
              renamed: 'yes',
              type: 'Span',
            },
          },
        },
        'rule-spec': { 'concept-projection': {} },
      });
    });
    return rules;
  }

  getInputConcepts() {
    const { upstreamNodes } = this.node;
    const inputConcepts = [];
    upstreamNodes.forEach((node) => {
      const { label } = node;
      inputConcepts.push({
        '@': {
          module: this.moduleName,
          name: label,
        },
      });
    });
    return inputConcepts;
  }

  transform() {
    const { label, overlapMatches, method } = this.node;
    const inputConcepts = this.getInputConcepts();
    const rules = this.getRules();
    const jsonStructure = {
      '@': {
        module: this.moduleName,
        name: label,
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:noNamespaceSchemaLocation': 'schema/target_lang_spec.xsd',
      },
      'input-concepts': {
        'input-concept': inputConcepts,
      },
      rule: rules,
    };

    if (overlapMatches) {
      jsonStructure['consolidation-spec'] = {
        '@': {
          policy: method,
          target: label,
        },
      };
    }

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
