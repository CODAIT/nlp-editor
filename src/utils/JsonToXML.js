const js2xmlparser = require('js2xmlparser');

import RegexNode from './transform/RegexNode';

export default function JsonToXML() {
  this.transform = function (node) {
    const { type } = node;
    let obj;
    switch (type) {
      case 'regex':
        obj = new RegexNode(node);
        break;
    }
    return obj.transform();
  };
}
