/* jslint node:true */
'use strict';

const fs = require("fs");

const config = require('./app/config');
const parse = require('./app/core/parser').parse;
const tokenize = require('./app/core/tokens').tokenize;
const EntityQuery = require('./app/core/EntityQuery');

let parsed = parse(config.input);
let tokens = tokenize(parsed);

fs.writeFile("out.json", JSON.stringify(tokens, null, 4), () => {})
// console.log(EntityQuery.build(tokens))