const js2xmlparser = require('js2xmlparser');

import DictionaryNode from './transform/DictionaryNode';
import RegexNode from './transform/RegexNode';
import SequenceNode from './transform/SequenceNode';

export default function JsonToXML() {
  this.transform = function (node) {
    const { type } = node;
    let obj;
    switch (type) {
      case 'regex':
        obj = new RegexNode(node);
        break;
      case 'dictionary':
        obj = new DictionaryNode(node);
        break;
      case 'sequence':
        obj = new SequenceNode(node);
        break;
    }
    return obj.transform();
  };
}
