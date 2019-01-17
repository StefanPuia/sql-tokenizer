/* jslint node:true */
'use strict';

const config = require('../config');

module.exports = {
    parse: parse,
    sanitize: sanitize,
    parseCondition: parseCondition
}

function parse(sql) {
    let tokens = config.tokens;

    sql = sanitize(sql);

    let tokenRegex = new RegExp(`(?=${tokens.join("|")})`, "gi");
    let commandRegex = new RegExp(`(${tokens.join("|")}) (.+)`, "i");

    let sqlCommands = sql.split(tokenRegex);

    let out = {};

    for (let c of sqlCommands) {
        let match = c.match(commandRegex);
        if(match) {
            out[match[1].replace(/\s/g, "")] = match[2];
        }
        else {
            console.log(c);
        }
    }

    return out;
}

function sanitize(sql) {
    let lines = sql.split('\n');
    let uncommented = [];
    for(let line of lines) {
        if(line.substr(0, 2) !== "--") {
            uncommented.push(line.replace(/(.*?)--.*/, "$1").trim());
        }
    }
    sql = uncommented.join(" ");
    sql = sql.replace(/\s+/g, " ");

    return sql;
}

function parseCondition(conditions) {
    conditions = compactize(conditions);
    conditions = conditions.replace(/\((.*?)/g, "( $1");
    conditions = conditions.replace(/(.*?)\)/g, "$1 )");

    return conditions.split(" ");
}

function compactize(sql) {
    for(let op of config.operators) {
        sql = sql.replace(op.expand, op.compact);
    }

    return sql;
}