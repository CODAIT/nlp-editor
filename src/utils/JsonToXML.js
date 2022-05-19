import {
  DictionaryNode,
  RegexNode,
  SequenceNode,
  UnionNode,
  LiteralNode
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
	  case 'literal':
		obj = new LiteralNode(this.canvasController, node, moduleName);
        break;
    }
    return obj.transform();
  };
}
