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

export default class RegexNode {
  constructor(node, moduleName) {
    this.node = node;
    this.moduleName = moduleName;
  }

  getMatchingFlag() {
    const { expressionType, caseSensitivity, canonEq, multiline, unixLines } =
      this.node;

    let matchingFlag = '';
    if (expressionType === 'literal') {
      matchingFlag = 'LITERAL';
      if (caseSensitivity === 'ignore') {
        matchingFlag += ' CASE_INSENSITIVE';
      } else if (caseSensitivity === 'match-unicode') {
        matchingFlag += ' CASE_INSENSITIVE UNICODE';
      }
    }
    if (expressionType === 'regular') {
      if (caseSensitivity === 'ignore') {
        matchingFlag += 'CASE_INSENSITIVE';
      } else if (caseSensitivity === 'match-unicode') {
        matchingFlag += 'CASE_INSENSITIVE UNICODE';
      } else if (caseSensitivity === 'match') {
        matchingFlag += 'DOTALL';
      }
      if (canonEq) {
        matchingFlag += ' CANON_EQ';
      }
      if (multiline) {
        matchingFlag += ' MULTILINE';
      }
      if (unixLines) {
        matchingFlag += ' UNIX_LINES';
      }
    }
    return matchingFlag;
  }

  getRange() {
    const { tokenRange } = this.node;
    let min, max;
    if (tokenRange.checked) {
      [min, max] = tokenRange.range;
    }
    return { min, max };
  }

  transform() {
    const { label, regexInput: pattern } = this.node;
    const fieldName = label;
    const matchingFlag = this.getMatchingFlag();
    const { min, max } = this.getRange();
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
              module: '',
              name: 'Document',
            },
          },
        ],
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
          field: {
            '@': {
              name: fieldName, //node name lowercase
            },
          },
        },
        'rule-spec': {
          'regex-match': {
            '@': {
              'matching-flag': matchingFlag,
            },
            'regex-pattern': pattern,
          },
        },
      },
    };

    if (
      this.node.child &&
      this.node.child.type === 'filter' &&
      this.node.child.primary === this.node.nodeId
    ) {
      const predicate = this.node.child.filterType;
      const funcName = this.node.child.funcName;
      const secondInput = this.node.child.secondary.label;
      jsonStructure[predicate] = {
        predicate: {
          'function-call': {
            '@': { 'func-name': funcName },
            arg: [
              {
                'field-spec': {
                  '@': {
                    'input-field-name': fieldName,
                    'input-concept-name': fieldName,
                    'input-concept-module': this.moduleName,
                  },
                },
              },
              {
                'field-spec': {
                  '@': {
                    'input-field-name': secondInput,
                    'input-concept-name': secondInput,
                    'input-concept-module': this.moduleName,
                  },
                },
              },
            ],
          },
        },
      };
      jsonStructure['input-concepts']['input-concept'].push({
        '@': {
          module: this.moduleName,
          name: secondInput,
        },
      });
    }

    if (min != undefined && max != undefined) {
      jsonStructure['rule']['rule-spec']['regex-match']['token-constraint'] = {
        '@': {
          min,
          max,
        },
      };
    }
    return {
      xml: js2xmlparser.parse('concept', jsonStructure, {
        declaration: { encoding: 'UTF-8' },
        format: { doubleQuotes: true },
      }),
      label,
    };
  }
}
