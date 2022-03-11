import {
  DictionaryNode,
  RegexNode,
  SequenceNode,
  UnionNode,
} from './transform';

export default function JsonToXML(canvasController) {
  this.canvasController = canvasController;
  this.transform = function (node, moduleName) {
    const { type } = node;
    let obj;
    switch (type) {
      case 'regex':
        obj = new RegexNode(node, moduleName);
        break;
      case 'dictionary':
        obj = new DictionaryNode(this.canvasController, node, moduleName);
        break;
      case 'sequence':
        obj = new SequenceNode(this.canvasController, node, moduleName);
        break;
      case 'union':
        obj = new UnionNode(node, moduleName);
        break;
    }
    return obj.transform();
  };
}
