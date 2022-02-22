import RegexNode from './validation/RegexNode';
import DictionaryNode from './validation/DictionaryNode';
import SequenceNode from './validation/SequenceNode';

export default function NodeValidator(canvasController) {
  this.canvasController = canvasController;
  this.validate = function (pipelineId, nodeProps) {
    const { type } = nodeProps;
    let node;
    switch (type) {
      case 'regex':
        node = new RegexNode(this.canvasController, pipelineId, nodeProps);
        break;
      case 'dictionary':
        node = new DictionaryNode(this.canvasController, pipelineId, nodeProps);
        break;
      case 'sequence':
        node = new SequenceNode(this.canvasController, pipelineId, nodeProps);
        break;
    }
    return node.validate();
  };
}
