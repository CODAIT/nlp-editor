const js2xmlparser = require('js2xmlparser');

import DictionaryNode from './transform/DictionaryNode';
import RegexNode from './transform/RegexNode';

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
    }
    return obj.transform();
  };
}
