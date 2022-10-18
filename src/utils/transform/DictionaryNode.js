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
import { getImmediateDownstreamNodes } from '../index';
import { store } from '../../redux/store';

export default class DictionaryNode {
  constructor(canvasController, node, moduleName) {
    this.canvasController = canvasController;
    this.node = node;
    this.moduleName = moduleName;
  }

  getEntries = () => {
    const { items, mapTerms } = this.node;
    const entries = [];
    for (const item in items) {
      if (mapTerms) {
        entries.push({
          'dict-entry': item,
          'mapped-entry': items[item],
        });
      } else {
        entries.push(items[item]);
      }
    }
    return entries;
  };

  getOutputSpecName = () => {
    const { label, nodeId } = this.node;
    const { nodes, pipelineId } = store.getState()['nodesReducer'];
    const pipelineLinks = this.canvasController.getLinks(pipelineId);
    const downstreamNodes = getImmediateDownstreamNodes(nodeId, pipelineLinks);
    if (downstreamNodes.length > 0) {
      const downstreamNodeId = downstreamNodes[0];
      const node = nodes.find((n) => n.nodeId === downstreamNodeId);
      if (node.type === 'union') {
        return node.label;
      }
    }
    return label;
  };

  getDictionaryWords = () => {
    const { label } = this.node;
    const entries = this.getEntries();
    const jsonStructure = {
      '@': {
        name: `${label}_dict`,
        type: 'static',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:noNamespaceSchemaLocation': 'schema/dict.xsd',
      },
      entries: {
        entry: entries,
      },
      languages: {
        lang: 'en',
      },
    };

    return js2xmlparser.parse('dictionary', jsonStructure, {
      declaration: { encoding: 'UTF-8' },
    });
  };

  transform() {
    const {
      caseSensitivity,
      externalResourceChecked,
      label,
      lemmaMatch,
      mapTerms,
    } = this.node;
    const fieldName = this.getOutputSpecName();
    const isCaseSensitive = caseSensitivity === 'match';
    const fieldValues = [
      {
        '@': {
          name: fieldName, //node name lowercase
          group: 0,
          hide: 'no',
          'func-call': 'no',
          renamed: 'no',
          type: 'Span',
        },
      },
    ];
    if (mapTerms) {
      fieldValues.push({
        '@': {
          name: `Mapped Term`,
          'mapped-entry': 'yes',
          hide: 'no',
        },
      });
    }
    const jsonStructure = {
      '@': {
        module: this.moduleName,
        name: label,
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:noNamespaceSchemaLocation': 'schema/target_lang_spec.xsd',
      },
      'input-concepts': {
        'input-concept': {
          '@': {
            module: '',
            name: 'Document',
          },
        },
      },
      rule: {
        'input-spec': {
          'input-span': {
            '@': {
              'input-concept-module': '',
              'input-concept-name': 'Document',
              'input-field-name': 'text',
            },
          },
        },
        'output-spec': {
          field: fieldValues,
        },
        'rule-spec': {
          'dictionary-match': {
            '@': {
              'case-sensitive': isCaseSensitive,
              'lemma-match': lemmaMatch,
              external: externalResourceChecked,
              'mapping-table': mapTerms,
            },
            'dict-name': `${label}_dict`,
          },
        },
      },
    };
    const dictionary = js2xmlparser.parse('concept', jsonStructure, {
      declaration: { encoding: 'UTF-8' },
      format: { doubleQuotes: true },
    });
    const words = this.getDictionaryWords();
    return [
      { xml: dictionary, label },
      { xml: words, label: `${label}_dict` },
    ];
  }
}
