'use strict';

// module.exports = function () {

// };

const esprima = require('esprima');
const babylon = require('babylon');

const fs = require('fs');

const content = fs.readFileSync('./example/sample.js', {encoding:'utf-8'});
const program = esprima.parse(content);

// console.log(program);
const res = babylon.parse(content);

const comments = res.comments;

const comment = comments[0];
const lines = comment.value.split('\n');

function parseLine(line) {
  line = line.trim();

  let isWord = false;
  let words = [];
  let word = '';
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === ' ') {
      if (isWord) {
        isWord = false;
        words.push(word);
        word = '';
      }

    } else {
      if (!isWord) {
        isWord = true;
      }

      word += line[i];
    }
  }

  if (word) {
    words.push(word);
  }


  if (words.length > 0 && words[0][0] === '@') {
    return {
      key: words[0].slice(1),
      prop: words.slice(1),
    };
  }
}

for (var i = 0; i < lines.length; i++) {
  console.log(parseLine(lines[i]));
}