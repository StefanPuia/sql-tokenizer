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
    sql = sql.replace(/ and /gi, " and ");
    sql = sql.replace(/ or /gi, " or ");

    return sql;
}

function parseCondition(conditions) {
    conditions = compactize(conditions);
    conditions = conditions.replace(/\((.*?)/g, "( $1");
    conditions = conditions.replace(/(.*?)\)/g, "$1 )");

    let values = []

    let m;
    while (m = conditions.match(/\'(.+?)\'/)) {
        values.push(m[1])
        conditions = conditions.substr(0, m.index) + ('$' + values.length) + conditions.substr(m.index + m[0].length)
    }
    let ops = conditions.split(" ");

    let out = [];
    for(let op of ops) {
        let m = false;
        while (m = op.match(/\$(\d+)/)) {
            op = op.substr(0, m.index) + `'${values[m[1]]}'` + op.substr(m.index + m[0].length)
        }
        out.push(op);
    }

    return out
}

function compactize(sql) {
    for(let op of config.operators) {
        sql = sql.replace(op.expand, op.compact);
    }

    return sql;
}