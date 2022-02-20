const js2xmlparser = require('js2xmlparser');

export default class DictionaryNode {
  constructor(node) {
    this.node = node;
  }

  transform() {
    const { caseSensitivity, externalResourceChecked, label, lemmaMatch } =
      this.node;
    const isCaseSensitive = caseSensitivity === 'match';
    const jsonStructure = {
      '@': {
        module: label,
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
          field: {
            '@': {
              name: label, //node name
            },
          },
        },
        'rule-spec': {
          'dictionary-match': {
            '@': {
              'case-sensitive': isCaseSensitive,
              'lemma-match': lemmaMatch,
              external: externalResourceChecked,
            },
            'dict-name': label,
          },
        },
      },
    };
    return js2xmlparser.parse('concept', jsonStructure);
  }
}
