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

export default class SequenceNode {
  constructor(canvasController, node, moduleName) {
    this.canvasController = canvasController;
    this.node = node;
    this.moduleName = moduleName;
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

  getOutputSpecName = () => {
    const { label, renamed } = this.node;
    return renamed || label;
  };

  getFieldsList() {
    const { upstreamNodes } = this.node;
    const fieldName = this.getOutputSpecName();
    const fields = [
      { '@': { name: fieldName, group: '0', hide: 'no', type: 'Span' } },
    ]; //add the first field for the sequence node
    upstreamNodes.forEach((node, index) => {
      const { label, renamed } = node;
      fields.push({
        '@': {
          name: renamed || label,
          group: index + 1,
          hide: !node.visible ? 'yes' : 'no', // attributes
          type: 'Span',
        },
      });
    });
    return fields;
  }

  getSequenceItem(node, sequenceLabel, index, tokens, length) {
    const { label } = node;
    let tokenGapItem = undefined;
    let atomItem = {
      '@': { group: `${index + 1}`, min: '1', max: '1' },
      'col-ref': {
        '@': {
          'input-concept-module': this.moduleName,
          'input-concept-name': label,
          'input-field-name': label,
        },
      },
    };
    if (node.type === 'literal') {
      atomItem['col-ref']['@']['isLiteral'] = 'yes';
    }
    if (index < length - 1 && tokens !== undefined) {
      const { min, max } = tokens;
      tokenGapItem = { '@': { min, max } };
    }
    const atomItemXML = js2xmlparser.parse('atom', atomItem, {
      declaration: { include: false },
    });
    if (tokenGapItem) {
      tokenGapItem = js2xmlparser.parse('token-gap', tokenGapItem, {
        declaration: { include: false },
      });
    }
    const temp = `${atomItemXML}${tokenGapItem || ''}`;
    return temp;
  }

  getSequence() {
    const { label: sequenceLabel, tokens, upstreamNodes } = this.node;
    let sequenceString = '';
    upstreamNodes.forEach((node, index) => {
      sequenceString += this.getSequenceItem(
        node,
        sequenceLabel,
        index,
        tokens[index],
        upstreamNodes.length,
      );
    });
    return sequenceString;
  }

  transform() {
    const { label, consolidate, consolidateTarget, consolidatePolicy } =
      this.node;
    const inputConcepts = this.getInputConcepts();
    const fieldList = this.getFieldsList();
    const sequence = this.getSequence();
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
      rule: {
        'output-spec': {
          field: fieldList,
        },
        'rule-spec': {
          'seq-pattern': {
            'pattern-spec': {
              sequence: {},
            },
          },
        },
      },
    };

    const xml = js2xmlparser.parse('concept', jsonStructure, {
      declaration: { encoding: 'UTF-8' },
      format: { doubleQuotes: true },
    });
    return {
      xml: xml.replace(`<sequence/>`, `<sequence>${sequence}</sequence>`),
      label,
    };
  }
}
