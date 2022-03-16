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
    const { items } = this.node;
    const entries = [];
    items.forEach((item) => {
      entries.push(item);
    });
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
    const { caseSensitivity, externalResourceChecked, label, lemmaMatch } =
      this.node;
    const fieldName = this.getOutputSpecName();
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
    const dictionary = js2xmlparser.parse('concept', jsonStructure, {
      declaration: { encoding: 'UTF-8' },
    });
    const words = this.getDictionaryWords();
    return [
      { xml: dictionary, label },
      { xml: words, label: `${label}_dict` },
    ];
  }
}
