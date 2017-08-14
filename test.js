'use strict';

const path = require('path');
const assert = require('assert');
const nodeParser = require('./');
const _ = require('lodash');

// TODO: add more tests

const sourceContent = `
@describe hello word
// This line should be ignore
// This line and two blank lines right below it, too


@test Source has to catch this one without trailing spaces     

// This line and a blank line right above it should be ignored

@Test       but this one has to be catched and trim heading spaces



`;

const sampleJSONFile = path.join('samples', 'sample.js');

describe('unit tests', function() {
  it('test Source', function() {
    const source = new nodeParser.Source(sourceContent);
    const expectedResult = [{
      key: 'describe',
      value: 'hello word',
    }, {
      key: 'test',
      value: 'Source has to catch this one without trailing spaces',
    }, {
      key: 'Test',
      value: 'but this one has to be catched and trim heading spaces'
    }];

    let token;
    let i = 0;

    while(token = source.getNext()) {
      assert(token.key === expectedResult[i].key);
      assert(token.value === expectedResult[i].value);
      i += 1;
    }

    assert(i === 3);
  });

  it('test Node', function() {
    const node1 = nodeParser.parseFile(sampleJSONFile)[0];
    const node2 = nodeParser.Node.fromJSON(node1.toJSON());
    assert(_.isEqual(node1.toJSON(), node2.toJSON()))
  });

  it('test Node', function() {
    const node1 = nodeParser.parseFile(sampleJSONFile)[0];
    const node2 = nodeParser.Node.fromJSON(node1.toJSON());
    assert(_.isEqual(node1.toJSON(), node2.toJSON()))
  });

  it('test custom input HTML generator', function() {
    const node = nodeParser.parseFile(sampleJSONFile)[0];
    const properties = Object.keys(node.properties).map(key => node.properties[key]);
    const input = properties[0];
    function HTMLGenerator(input, opts = {}) {
      const attributes = nodeParser.attributeHTMLGenerator(input.attributes);
      return `<input class="mentality-input" ${attributes}>`;
    }

    const expectedResult = '<input class="mentality-input" type="number" required="true" step="0" min="1">';
    assert(expectedResult === input.toHTML(HTMLGenerator));
  });
});


describe('e2e tests', function() {
  it('test parser', function() {
    const nodes = nodeParser.parseFile(sampleJSONFile);
    assert(nodes.length === 1);
    assert('description' in nodes[0].attributes);
    assert(Object.keys(nodes[0].properties).length === 2);
  });
});
