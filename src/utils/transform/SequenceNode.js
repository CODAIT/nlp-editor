const js2xmlparser = require('js2xmlparser');

export default class SequenceNode {
  constructor(node, moduleName) {
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
          name: label.toLowerCase(),
        },
      });
    });
    return inputConcepts;
  }

  getFieldsList() {
    const { label, upstreamNodes } = this.node;
    const fields = [
      { '@': { name: label, group: '0', hide: 'no', type: 'Span' } },
    ]; //add the first field for the sequence node
    upstreamNodes.forEach((node, index) => {
      const { label } = node;
      fields.push({
        '@': {
          name: label.toLowerCase(),
          group: index + 1,
          hide: 'yes',
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
    if (index < length - 1) {
      const { min, max } = tokens;
      tokenGapItem = { '@': { min, max } };
    }
    const atomItemXML = js2xmlparser
      .parse('atom', atomItem)
      .replace(`<?xml version='1.0'?>`, '');
    if (tokenGapItem) {
      tokenGapItem = js2xmlparser
        .parse('token-gap', tokenGapItem)
        .replace(`<?xml version='1.0'?>`, '');
    }
    const temp = `${atomItemXML}${tokenGapItem || ''}`;
    console.log(temp);
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
    const { label } = this.node;
    const inputConcepts = this.getInputConcepts();
    const fieldList = this.getFieldsList();
    const sequence = this.getSequence();
    const jsonStructure = {
      '@': {
        module: label,
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
    const xml = js2xmlparser.parse('concept', jsonStructure);
    return xml.replace(`<sequence/>`, `<sequence>${sequence}</sequence>`);
  }
}
