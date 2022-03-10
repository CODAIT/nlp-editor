const js2xmlparser = require('js2xmlparser');

import { store } from '../../redux/store';
export default class UnionNode {
  constructor(node, moduleName) {
    this.node = node;
    this.moduleName = moduleName;
    console.log(store.getState());
  }

  getChildUpstreamNodes = (nodeId) => {
    const { nodes } = store.getState()['nodesReducer'];
    const node = nodes.find((n) => n.nodeId === nodeId);
    const { upstreamNodes = [] } = node;
    return upstreamNodes;
  };

  getInputSpans = (childNode) => {
    const { label: parentNodeLabel } = this.node; //union-node label
    const { label, nodeId } = childNode;
    const upstreamNodes = this.getChildUpstreamNodes(nodeId);
    const spans = [
      {
        '@': {
          'input-concept-module': this.moduleName,
          'input-concept-name': label,
          'input-field-name': parentNodeLabel,
        },
      },
    ]; //add the first field for the sequence node
    upstreamNodes.forEach((node, index) => {
      spans.push({
        '@': {
          'input-concept-module': this.moduleName,
          'input-concept-name': label,
          'input-field-name': node.label,
        },
      });
    });
    return spans;
  };

  getRules() {
    const { upstreamNodes, label } = this.node;
    const rules = [];
    upstreamNodes.forEach((n) => {
      const inputSpans = this.getInputSpans(n);
      rules.push({
        'input-spec': {
          'input-span': inputSpans,
        },
        'output-spec': {
          field: {
            '@': { name: label, type: 'Span' },
          },
        },
        'rule-spec': { 'concept-projection': {} },
      });
    });
    return rules;
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

  transform() {
    const { label, overlapMatches, method } = this.node;
    const inputConcepts = this.getInputConcepts();
    const rules = this.getRules();
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
      rule: rules,
    };

    if (overlapMatches) {
      jsonStructure['consolidation-spec'] = {
        '@': {
          policy: method,
          target: label,
        },
      };
    }

    const xml = js2xmlparser.parse('concept', jsonStructure, {
      declaration: { encoding: 'UTF-8' },
    });

    return {
      xml,
      label,
    };
  }
}
