'use strict';

const babylon = require('babylon');
const fs = require('fs');
const glob = require("glob");
const Promise = require('bluebird');

const globAsync = Promise.promisify(glob);

const UNPARSED_PROP = new Set([
  'description'
]);

/**
 * Simple HTML generator for Node object.
 * @param  {Node}     node The node to be generated.
 * @return {String}        HTML string.
 */
function formHTMLGenerator(node, opts = {}) {
  const {
    indent = '    ',
  } = opts;

  let attributes = '';
  let properties = node.properties.map(property => indent + property.toHTML(inputHTMLGenerator, opts)).join('\n')
  return `<node ${attributes}>\n${properties}\n</node>`;
}

function attributeHTMLGenerator(propertyDict, opts = {}) {
  const {
    ignoreTag = UNPARSED_PROP
  } = opts;

  const attributes = []
  const keys = Object.keys(propertyDict);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const value = propertyDict[key];

    if (!ignoreTag.has(key)) {
      attributes.push(`${key}="${value}"`)
    }
  }
  return attributes.join(' ');
}

/**
 * Simple HTML generator for property object.
 * @param  {property}     property  The node to be generated.
 * @return {String}           HTML string.
 */
function inputHTMLGenerator(property, opts = {}) {
  const attributes = attributeHTMLGenerator(property.attributes, opts);
  return `<input ${attributes}>`;
}

/**
 * Main object used to serve property string to parser.
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
   * Get next token from property content. This function only returns `undefined` if there is nothing else to be parsed or a token object which contains a key and a value if a line is a valid entry.
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
 * Main class to handle nodes.
 */
class Node {
  constructor(name) {
    this.name = name;
    this.attributes = {};
    this.properties = [];
  }

  /**
   * Add an property entry to the node.
   * @param {property} property
   */
  addInput(property) {
    this.properties.push(property);
  }

  /**
   * Add a attributes to the node.
   * @param {String} key
   * @param {String} value
   */
  addProperty(key, value) {
    this.attributes[key] = value;
  }

  /**
   * Convert this node to HTML string.
   * @param  {Func} HTMLgenerator Function used to generate HTML. Default: `formHTMLGenerator`.
   * @param  {Object} opts        options.
   * @return {String}             HTML string.
   */
  toHTML(HTMLgenerator = formHTMLGenerator, opts = {}) {
    return HTMLgenerator(this, opts);
  }

  /**
   * Convert object to JSON.
   * @return {Object}
   */
  toJSON() {
    return {
      name: this.name,
      attributes: this.attributes,
      properties: this.properties.map(property => property.toJSON()),
    };
  }

  /**
   * Construc node from JSON.
   * @param  {Object} json 
   * @return {Node}
   */
  static fromJSON(json) {
    const {
      type,
      name,
      properties,
      attributes,
    } = json;

    const node = new Node(name);
    for (let i = 0; i < properties.length; i += 1) {
      node.addInput(Property.fromJSON(properties[i]));
    }

    const keys = Object.keys(attributes);
    for (let i = 0; i < keys.length; i += 1) {
      node.addProperty(keys[i], attributes[keys[i]]);
    }

    return node;
  }
}

class Property {
  constructor(name) {
    this.name = name;
    this.attributes = {};
  }

  /**
   * Add a attributes to the node.
   * @param {String} key
   * @param {String} value
   */
  addProperty(key, value) {
    this.attributes[key] = value;
  }

  /**
   * Convert this property to HTML string.
   * @param  {Func} HTMLgenerator Function used to generate HTML. Default: `inputHTMLGenerator`.
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
      attributes: this.attributes,
    };
  }

  /**
   * Construc property from JSON.
   * @param  {Object} json 
   * @return {Node}
   */
  static fromJSON(json) {
    const {
      name,
      attributes,
    } = json;

    const property = new Property(name);
    const keys = Object.keys(attributes);
    for (let i = 0; i < keys.length; i += 1) {
      property.addProperty(keys[i], attributes[keys[i]]);
    }

    return property;
  }
}

/**
 * Parse docs given string.
 * @param  {String} content String to be parsed.
 * @param  {Object} opts    Options.
 * @return {Node[]}         All nodes in string.
 */
function parse(content, opts = {}) {
  const {
    classes = {}
  } = opts;

  const {
    InputNode = Property,
    FormNode = Node,
  } = classes;

  const objs = [];
  const source = new Source(content);

  let property;
  let obj;
  let token;

  while (token = source.getNext()) {
    const {
      key,
      value,
    } = token;

    switch (key) {
      case 'node':
        if (obj) {
          objs.push(obj);
        }
        obj = new FormNode(value);
        property = obj;
        break;
      case 'property':
        property = new InputNode(value);
        if (obj) {
          obj.addInput(property);
        } else {
          throw new Error('Missing Node.');
        }
        break;
      default:
        if (property) {
          property.addProperty(key, value);
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
 * @return {Node[]}         All nodes in string.
 */
function parseFile(file, opts = {}) {
  const fileContent = fs.readFileSync(file, {encoding:'utf-8'});
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
 * Parse entire modules given an array of globs.
 * @param  {Array[Glob]}   paths
 * @param  {Function} cb   
 * @return {Promise} 
 */
function parseModule(paths, cb = () => {}) {
  let nodes = [];
  let promises = [];
  for (let a = 0; a < paths.length; a += 1) {
    promises.push(globAsync(paths[a]));
  }

  return Promise.all(promises)
    .then((promiseRes) => {
      for (let a = 0; a < promiseRes.length; a++) {
        for (let b = 0; b < promiseRes[a].length; b++) {
          nodes = nodes.concat(parseFile(promiseRes[a][b]));
        }
      }
      return nodes;
    })
}

module.exports = {
  parseLine,
  parseModule,
  parse,
  parseFile,
  Property,
  Node,
  Source,
  UNPARSED_PROP,
  formHTMLGenerator,
  inputHTMLGenerator,
  attributeHTMLGenerator,
};