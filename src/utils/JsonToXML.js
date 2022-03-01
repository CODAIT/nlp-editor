import { DictionaryNode, RegexNode, SequenceNode } from './transform';

export default function JsonToXML() {
  this.transform = function (node, moduleName) {
    const { type } = node;
    let obj;
    switch (type) {
      case 'regex':
        obj = new RegexNode(node, moduleName);
        break;
      case 'dictionary':
        obj = new DictionaryNode(node, moduleName);
        break;
      case 'sequence':
        obj = new SequenceNode(node, moduleName);
        break;
    }
    return obj.transform();
  };
}
