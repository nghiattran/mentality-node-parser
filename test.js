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

  it('test Form', function() {
    const form1 = nodeParser.parseFile(sampleJSONFile)[0];
    const form2 = nodeParser.Form.fromJSON(form1.toJSON());
    assert(_.isEqual(form1.toJSON(), form2.toJSON()))
  });

  it('test Form', function() {
    const form1 = nodeParser.parseFile(sampleJSONFile)[0];
    const form2 = nodeParser.Form.fromJSON(form1.toJSON());
    assert(_.isEqual(form1.toJSON(), form2.toJSON()))
  });

  it('test custom input HTML generator', function() {
    const form = nodeParser.parseFile(sampleJSONFile)[0];
    const input = form.inputs[0];
    function HTMLGenerator(input, opts = {}) {
      const properties = nodeParser.propertyHTMLGenerator(input.properties);
      return `<input class="mentality-input" ${properties}>`;
    }

    const expectedResult = '<input class="mentality-input" type="number" required="true" step="0" min="1">';
    assert(expectedResult === input.toHTML(HTMLGenerator));
  });
});


describe('e2e tests', function() {
  it('test parser', function() {
    const forms = nodeParser.parseFile(sampleJSONFile);
    assert(forms.length === 1);
    assert('description' in forms[0].properties);
    assert(forms[0].inputs.length === 2);
  });
});
