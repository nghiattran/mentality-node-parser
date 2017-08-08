# mentality-node-parser

Utility module used to parse layer node for mentality library.

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]

## Installation

```
  npm install --save mentality-node-parser
```

## Basic usage

Sample JS file `input.js`:

```js
/*
@form Node
@description Node description here.

@input          units
@type           number

@input          activation
@type           text
@description    Activation description here.
 */


// Some js here
let a = 1 + 2;
```

### Parse a file.

```js
const mentalityNodeParser = require('mentality-node-parser');
const forms = mentalityNodeParser.parseFile('input.js');

/*
[{
  name: 'Dense',
  properties: {
    type: 'text',
    description: 'Node description here'
  },
  inputs: [{
    name: 'units',
    properties: {
      type: 'number',
      required: true
    }
  }, {
    name: 'activation',
    properties: {
      type: 'text',
      description: 'Activation description here.'
    }
  }]
}]
*/
```

### Generate HTML

```js
const input = forms[0].inputs;

input[0].toHTML();

// <input type="number" required="true">

input[1].toHTML();

// <input type="text">

forms.toHTML()

/*
<form>
  <input type="number" required="true">
  <input type="text">
</form>
*/
```

## Getting To Know Yeoman

Yeoman has a heart of gold. He&#39;s a person with feelings and opinions, but he&#39;s very easy to work with. If you think he&#39;s too opinionated, he can be easily convinced. Feel free to [learn more about him](http://yeoman.io/).

## Created with
[Yeoman](https://npmjs.org/package/yo) and [Generator-simple-package](https://npmjs.org/package/generator-simple-package)

## License
MIT © [nghiattran]()

[npm-image]: https://badge.fury.io/js/mentality-node-parser.svg
[npm-url]: https://npmjs.org/package/mentality-node-parser
[travis-image]: https://travis-ci.org/nghiattran/mentality-node-parser.svg?branch=master
[travis-url]: https://travis-ci.org/nghiattran/mentality-node-parser
[daviddm-image]: https://david-dm.org/nghiattran/mentality-node-parser.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/nghiattran/mentality-node-parser
[coveralls-image]: https://coveralls.io/repos/nghiattran/mentality-node-parser/badge.svg
[coveralls-url]: https://coveralls.io/github/nghiattran/mentality-node-parser
