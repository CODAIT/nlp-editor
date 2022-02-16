const js2xmlparser = require('js2xmlparser');

export default class JsonToXML {
  transform(props) {
    const { type } = props;
    switch (type) {
      case 'regex':
        return this.regexNode(props);
    }
  }

  regexNode(props) {
    const { label, pattern, matchingFlag, min, max } = props;
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
          'regex-match': {
            '@': {
              'matching-flag': matchingFlag,
            },
            'regex-pattern': pattern,
          },
        },
      },
    };
    if (min != undefined && max != undefined) {
      jsonStructure['rule']['rule-spec']['regex-match']['token-constraint'] = {
        '@': {
          min,
          max,
        },
      };
    }
    const xml = js2xmlparser.parse('concept', jsonStructure);
    return xml;
  }
}
