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
    const { label, scope } = this.node;
    const predicate = this.node.filterType;
    const funcName = this.node.funcName;
    const { nodes } = store.getState()['nodesReducer'];
    const primaryInput = nodes.find((n) => n.nodeId === this.node.primary);
    const secondInput = nodes.find((n) => n.nodeId === this.node.secondary);
    let overrideSecondaryFilterInputName;
    if (secondInput.type === 'filter') {
      const filterParent = nodes.find((n) => n.nodeId === secondInput.primary);
      if (filterParent) {
        overrideSecondaryFilterInputName = filterParent.label;
      }
    }

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
              name: primaryInput.label,
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
                'input-concept-name': primaryInput.label,
                'input-field-name': primaryInput.label,
              },
            },
          ],
        },
        'output-spec': {
          field: [
            {
              '@': {
                name: primaryInput.label,
              },
            },
          ],
        },
        'rule-spec': {
          'concept-projection': {},
        },
      },
    };

    jsonStructure[predicate] = {
      predicate: {
        'function-call': {
          '@': { 'func-name': funcName },
          arg: [
            {
              'field-spec': {
                '@': {
                  'input-field-name': primaryInput.label,
                  'input-concept-name': label,
                  'input-concept-module': this.moduleName,
                },
              },
            },
            {
              'field-spec': {
                '@': {
                  'input-field-name':
                    overrideSecondaryFilterInputName || secondInput.label,
                  'input-concept-name': secondInput.label,
                  'input-concept-module': this.moduleName,
                },
              },
            },
          ],
        },
      },
    };

    /*
	switch( scope ) {
		case 'length':
			> shorter than, longer than, equals
				=> INPUT
			> characters, tokens 
			break;
		case 'text':
			?? matches, contains
				> customized regular expression in
					=> INPUT regular expression
					=> case sensitivity **
				> dictionary terms in
					=> NODE (secondary)
					=> case sensitivity *
				> regular expression in
					=> NODE (secondary)
					=> case sensitivity **
			break;
		case 'range':
			switch(funcName) {
				case 'Overlaps':
					https://pages.github.ibm.com/ai-foundation/watson-nlp-documentation/library-system-t/aql-ref-guide.html#overlaps
					jsonStructure[predicate]['predicate']['function-call']['@']['func-name'] = funcName;
					jsonStructure[predicate]['predicate']['function-call'].arg = [{}, {}];
					break;
				case 'Equals':
					> column
						=> NODE (secondary)
					> constant
						=> INPUT
					https://pages.github.ibm.com/ai-foundation/watson-nlp-documentation/library-system-t/aql-ref-guide.html#equals
					break;
				case 'Contains':
					=> NODE (secondary)
					https://pages.github.ibm.com/ai-foundation/watson-nlp-documentation/library-system-t/aql-ref-guide.html#contains
					break;
				case 'StartsWith':
				case 'EndsWith':
					=> NODE (secondary)
					break;
				case 'OccursBefore':
				case 'OccursAfter':
					=> NODE (secondary)
					> no limit
					> between two
						=> INPUT
						=> INPUT
						> characters/tokens
					> exactly
						=> INPUT
						> characters/tokens
					break;
			}			
			break;
	}
	*/

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
