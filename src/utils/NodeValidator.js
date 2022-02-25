import {
  InputNode,
  DictionaryNode,
  SequenceNode,
  RegexNode,
} from './validation';

export default function NodeValidator(canvasController) {
  this.canvasController = canvasController;
  this.validate = function (pipelineId, nodeProps) {
    const { type } = nodeProps;
    let node;
    switch (type) {
      case 'input':
        node = new InputNode(this.canvasController, pipelineId, nodeProps);
        break;
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
