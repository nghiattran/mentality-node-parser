'use strict';

const babylon = require('babylon');
const fs = require('fs');


const UNPARSED_PROP = new Set([
  'desc'
]);

/**
 * Parse one line.
 * @param  {String} aline A line to be parsed.
 * @return {Object | undefined}       If the line is a valid entry, a object contains a key and a value is returned. Else, returns nothing.
 */
function parseLine(aline = '') {
  const line = aline.trim();

  let key = '';
  let firstWord = false;
  let i = 0;
  while (i < line.length && line[i] !== ' ' && !firstWord) {
    if (line[i] === ' ') {
      if (key) {
        firstWord = true;
      }
    } else {
      key += line[i];
    }

    i += 1;
  }

  if (key && key[0] === '@') {
    return {
      key: key.slice(1),
      value: line.slice(i).trim(),
    };
  }
}

/**
 * Simple HTML generator for Form object.
 * @param  {Form}     form The form to be generated.
 * @return {String}        HTML string.
 */
function formHTMLGenerator(form) {
  const {
    indent = '    ',
  } = opts;

  let properties = '';
  let inputs = form.inputs.map(input => indent + input.toHTML(inputHTMLGenerator, opts)).join('\n')
  return `<form ${properties}>\n${inputs}\n</form>`;
}

/**
 * Simple HTML generator for Input object.
 * @param  {Input}     input  The form to be generated.
 * @return {String}           HTML string.
 */
function inputHTMLGenerator(input) {
  const {
    ignoreTag = UNPARSED_PROP
  } = opts;

  const properties = []
  const keys = Object.keys(input.properties);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const value = input.properties[key];

    if (!ignoreTag.has(key)) {
      properties.push(`${key}="${value}"`)
    }
  }

  return `<input ${properties.join(' ')}>`;
}

/**
 * Main object used to serve input string to parser.
 */
class Source {
  /**
   * Constructor.
   * @param  {String} content
   */
  constructor(content) {
    this.lines = content.split('\n');
    this.index = 0;
  }

  /**
   * Get next token from input content. This function only returns `undefined` if there is nothing else to be parsed or a token object which contains a key and a value if a line is a valid entry.
   * @return {Object} Token.
   */
  getNext() {
    let token;

    do {
      token = parseLine(this.lines[this.index]);
      this.index += 1;
    } while(!token && this.index < this.lines.length)

    return token;
  }
}

/**
 * Main class to handle forms.
 */
class Form {
  constructor(name) {
    this.name = name;
    this.properties = {};
    this.inputs = [];
  }

  /**
   * Add an input entry to the form.
   * @param {Input} input
   */
  addInput(input) {
    this.inputs.push(input);
  }

  /**
   * Add a properties to the form.
   * @param {String} key
   * @param {String} value
   */
  addProperty(key, value) {
    this.properties[key] = value;
  }

  /**
   * Convert this form to HTML string.
   * @param  {Func} HTMLgenerator Function used to generate HTML. Default: `formHTMLGenerator`.
   * @param  {Object} opts        options.
   * @return {String}             HTML string.
   */
  toHTML(HTMLgenerator = formHTMLGenerator, opts = {}) {
    return HTMLgenerator(this);
  }

  /**
   * Convert object to JSON.
   * @return {Object}
   */
  toJSON() {
    return {
      name: this.name,
      properties: this.properties,
      inputs: this.inputs.map(input => input.toJSON()),
    };
  }

  /**
   * Construc form from JSON.
   * @param  {Object} json 
   * @return {Form}
   */
  static fromJSON(json) {
    const {
      type,
      name,
      inputs,
      properties,
    } = json;

    const form = new Form(name);
    for (let i = 0; i < inputs.length; i += 1) {
      form.addInput(Input.fromJSON(inputs[i]));
    }

    const keys = Object.keys(properties);
    for (let i = 0; i < keys.length; i += 1) {
      form.addProperty(keys[i], properties[keys[i]]);
    }

    return form;
  }
}

class Input {
  constructor(name) {
    this.name = name;
    this.properties = {};
  }

  /**
   * Add a properties to the form.
   * @param {String} key
   * @param {String} value
   */
  addProperty(key, value) {
    this.properties[key] = value;
  }

  /**
   * Convert this input to HTML string.
   * @param  {Func} HTMLgenerator Function used to generate HTML. Default: `formHTMLGenerator`.
   * @param  {Object} opts        options.
   * @return {String}             HTML string.
   */
  toHTML(HTMLgenerator = inputHTMLGenerator, opts = {}) {
    return HTMLgenerator(this);
  }

  /**
   * Convert object to JSON.
   * @return {Object}
   */
  toJSON() {
    return {
      name: this.name,
      properties: this.properties,
    };
  }

  /**
   * Construc input from JSON.
   * @param  {Object} json 
   * @return {Form}
   */
  static fromJSON(json) {
    const {
      name,
      properties,
    } = json;

    const input = new Input(name);
    const keys = Object.keys(properties);
    for (let i = 0; i < keys.length; i += 1) {
      input.addProperty(keys[i], properties[keys[i]]);
    }

    return input;
  }
}

/**
 * Parse docs given string.
 * @param  {String} content String to be parsed.
 * @param  {Object} opts    Options.
 * @return {Form[]}         All forms in string.
 */
function parse(content, opts = {}) {
  const {
    classes = {}
  } = opts;

  const {
    InputNode = Input,
    FormNode = Form,
  } = classes;

  const objs = [];
  const source = new Source(content);

  let input;
  let obj;
  let token;

  while (token = source.getNext()) {
    const {
      key,
      value,
    } = token;

    switch (key) {
      case 'form':
        if (obj) {
          objs.push(obj);
        }
        obj = new FormNode(value);
        input = obj;
        break;
      case 'input':
        input = new InputNode(value);
        if (obj) {
          obj.addInput(input);
        } else {
          throw new Error('Missing Form.');
        }
        break;
      default:
        if (input) {
          input.addProperty(key, value);
        }
        break;
    }
  }

  if (obj) {
    objs.push(obj);
  }

  return objs;
}

/**
 * Parse docs given a file.
 * @param  {String} file    Filename.
 * @param  {Object} opts    Options.
 * @return {Form[]}         All forms in string.
 */
function parseFile(file, opts = {}) {
  const fileContent = fs.readFileSync('./samples/sample.js', {encoding:'utf-8'});
  const contentTree = babylon.parse(fileContent);
  const comments = contentTree.comments;
  let nodes = [];
  for (let a = 0; a < comments.length; a += 1) {
    if (comments[a].type !== 'CommentBlock') {
      continue;
    }

    const res = parse(comments[a].value, opts);

    for (let b = 0; b < res.length; b += 1) {
      nodes.push(res[b]);
    }
  }

  return nodes;
}

module.exports = {
  parseLine,
  parse,
  parseFile,
  Input,
  Form,
  Source,
  UNPARSED_PROP,
  formHTMLGenerator,
  inputHTMLGenerator,
};
