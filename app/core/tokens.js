/* jslint node:true */
'use strict';

const parseConditions = require('./parser').parseCondition;

module.exports = {
    tokenize: tokenize
}

function tokenize(parsed) {
    let out = {};

    for (let i of Object.keys(parsed)) {
        if(parsed[i]) {
            if(typeof instructions[i] == "function") {
                out[i] = instructions[i](parsed[i].trim());
            }
            else {
                out[i] = parsed[i];
            }
        }
    }

    return out;
}

function conditionBuilder(string) {
    let inFix = parseConditions(string);

    let preFix = [];
    let stack = [];
    
    function getPriority(op) {
        op = op ? op.toLowerCase() : "";
        switch(op) {
            case 'or': return 1;
            case 'and': return 2;
        }
        return 0;
    }

    for(let x of inFix) {
        if(["(", ")", "and", "or"].indexOf(x.toLowerCase()) == -1) {
            preFix.push(x);
        }
        else if(x == "(") {
            stack.push(x);
        }
        else if(x == ")") {
            while (stack.slice().pop() != "(") {
                preFix.push(stack.pop());
            }

            stack.pop();
        }
        else {
            while (getPriority(x) <= getPriority(stack.slice().pop())) {
                preFix.push(stack.pop());
            }

            stack.push(x);
        }
    }

    while (stack.length) {
        preFix.push(stack.pop());
    }

    if(preFix.length) {
        let out = [preFix[0]];
        for(let i = 1; i < preFix.length; i++) {
            if(preFix[i] !== out.slice().pop()) {
                out.push(preFix[i]);
            }
        }
        return makeCondition(out, [], []);
    }
    return {};
}

function isOperator(x) {
    if (!x) return false;
    return ["and", "or"].indexOf(x.toLowerCase()) > -1;
}

function makeCondition(preFix, ops, out) {
    if (!preFix || preFix.length == 0) {
        return out;
    }

    if(preFix.length == 1 && !isOperator(preFix[0])) {
        return {
            op: "and",
            ops: preFix
        }
    }

    if (isOperator(preFix[0])) {
        let children = []
        let isSame = false;
        if(ops.length >= 2) {
            isSame = true;
            for(let o of ops) {
                if(typeof o == "string") {
                    children.push(o);
                }
                else {
                    if(o.op != preFix[0]) {
                        isSame = false;
                        break;
                    }
                    else {
                        children = children.concat(o.ops);
                    }
                }
            }
        }

        out = {
            op: preFix[0],
            ops: isSame ? children : ops
        }
        return makeCondition(preFix.slice(1), [out], out);
    }

    else {
        ops.push(preFix[0])
        return makeCondition(preFix.slice(1), ops, out);
    }    
}

function buildField(field) {
    let out = {
        field: ""
    };

    let parts = field.split(".");

    if (parts.length == 2) {
        out.table = parts[0];
        out.field = parts[1];
    }
    else {
        out.field = parts[0];
    }

    return out;
}

const instructions = {
    "select": (fields) => {
        fields = fields.split(",").map(f => f.trim());

        let out = {
            fields: []
        }

        if(fields.length == 1 && fields[0] == "*") {
            return out;
        }

        for(let field of fields) {
            let alias = field.split(" ");
            if(alias.length == 3 && alias[1].toLowerCase() == "as") {
                let f = buildField(alias[0]);
                f.alias = alias[2];
                out.fields.push(f);
            }
            else {
                out.fields.push(buildField(alias[0]))
            }
        }

        return out;
    },

    "from": (table) => {
        let out = {};

        let alias = table.split(" ");
        out.table = alias[0];
        if(alias.length == 2 || (alias.length == 3 && alias[1].toLowerCase() == "as")) {
            out.alias = alias.length == 3 ? alias[2] : alias[1];
        }

        return out;
    },

    "innerjoin": (line) => {
        let out = {};

        let parts = line.split(/\son\s/i);
        Object.assign(out, instructions.from(parts[0]));
        out.on = conditionBuilder(parts[1]);

        return out;
    },

    "fullouterjoin": (line) => {
        let out = {};

        let parts = line.split(/\son\s/i);
        Object.assign(out, instructions.from(parts[0]));
        out.on = conditionBuilder(parts[1]);

        return out;
    },

    "where": (conditions) => {
        return conditionBuilder(conditions);
    },

    "orderby": (field) => {
        return buildField(field);
    },

    "limit": (limit) => {
        let intLimit = parseInt(limit);
        if (!isNaN(intLimit)) {
            return intLimit;
        }

        return 1;
    }
}