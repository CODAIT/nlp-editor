const js2xmlparser = require('js2xmlparser');

export default class DictionaryNode {
  constructor(node, moduleName) {
    this.node = node;
    this.moduleName = moduleName;
  }

  transform() {
    const { caseSensitivity, externalResourceChecked, label, lemmaMatch } =
      this.node;
    const fieldName = label.toLowerCase();
    const isCaseSensitive = caseSensitivity === 'match';
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
            module: this.moduleName,
            name: 'Document',
          },
        },
      },
      rule: {
        'input-spec': {
          'input-span': {
            '@': {
              'input-concept-module': this.moduleName,
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
          'dictionary-match': {
            '@': {
              'case-sensitive': isCaseSensitive,
              'lemma-match': lemmaMatch,
              external: externalResourceChecked,
            },
            'dict-name': `${label}_dict`,
          },
        },
      },
    };
    return js2xmlparser.parse('concept', jsonStructure);
  }
}
