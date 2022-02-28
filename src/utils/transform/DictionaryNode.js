const js2xmlparser = require('js2xmlparser');

export default class DictionaryNode {
  constructor(node, moduleName) {
    this.node = node;
    this.moduleName = moduleName;
  }

  getEntries = () => {
    const { items } = this.node;
    const entries = [];
    items.forEach((item) => {
      entries.push(item);
    });
    return entries;
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

    return js2xmlparser.parse('dictionary', jsonStructure);
  };

  transform() {
    const { caseSensitivity, externalResourceChecked, label, lemmaMatch } =
      this.node;
    const fieldName = label;
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
    const dictionary = js2xmlparser.parse('concept', jsonStructure);
    const words = this.getDictionaryWords();
    return [
      { xml: dictionary, label },
      { xml: words, label: `${label}_dict` },
    ];
  }
}
