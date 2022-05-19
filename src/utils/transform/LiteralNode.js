const js2xmlparser = require('js2xmlparser');
import { getImmediateDownstreamNodes } from '../index';
import { store } from '../../redux/store';

export default class LiteralNode {
  constructor(canvasController, node, moduleName) {
    this.canvasController = canvasController;
    this.node = node;
    this.moduleName = moduleName;
  }

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

  transform() {
    const { inputText, label, lemmaMatch } =
      this.node;
    const fieldName = this.getOutputSpecName();
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
				name: "Literal_1",
				group: 0,
				hide: "no",
				"func-call":"no",
				"renamed": "no",
				type: "Span"
            },
          },
        },
        'rule-spec': {
          'seq-pattern': {
			  'pattern-spec': {
				  'sequence': {
					  'atom': {
						  '@': {
							'group': 0,
							'min': 1,
							'max': 1
						  },
						  'dict-match': {
							  '@': {
								  'entry': inputText,
								  'lemma-match': lemmaMatch								  
							  }
						  }
					  }
				  }
			  }
          },
        },
      },
    };
    const literal = js2xmlparser.parse('concept', jsonStructure, {
      declaration: { encoding: 'UTF-8' },
	  format: { doubleQuotes: true }
    });
    return [
      { xml: literal, label }
    ];
  }
}
