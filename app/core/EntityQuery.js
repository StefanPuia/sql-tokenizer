/* jslint node:true */
'use strict';

module.exports = {
    build: buildQuery
}

function buildQuery(tokens) {
    let out = "";
    if(tokens.innerjoin || tokens.fullouterjoin) {
        out += "EntityDynamicQuery.use(delegator)";
        Object.keys(EntityDynamicQuery).forEach(k => {
            if (tokens[k] && EntityDynamicQuery[k]) {
                out += EntityDynamicQuery[k](tokens[k]);
            }
        })
        if (!tokens["limit"]) {
            out += ".queryList()";
        }
    }
    else {
        out += "EntityQuery.use(delegator)";
        Object.keys(EntityQuery).forEach(k => {
            if (tokens[k] && EntityQuery[k]) {
                out += EntityQuery[k](tokens[k]);
            }
        })
        if(!tokens["limit"]) {
            out += ".queryList()";
        }
    }

    return out.replace(/\.(\w+\()/g, '\n.$1');
}

const EntityQuery = {
    "select": (t) => {
        if(t.fields.length) {
            let fields = [];
            for(let f of t.fields) {
                fields.push(makeFieldName(f.field));
            }
            return `.select("${fields.join('", "')}")`
        }
        return `.select()`;
    },

    "from": (t) => {
        return `.from("${makeTableName(t.table)}")`;
    },

    "where": (t) => {
        if(!t.ops || !t.ops.length) {
            return "";
        }
        if (t.op == "and" && t.ops.map(o => typeof o).join(" ").indexOf("object") == -1) {
            let cond = [];
            let isSimple = true;
            for(let o of t.ops) {
                let condition = expandCondition(o);
                if(condition.function != "eq") {
                    isSimple = false;
                }
                cond.push(condition);
            }
            if(isSimple) {
                return `.where("${cond.map(c => {
                    return `${makeFieldName(c.ops[0].op)}", "${c.ops[1].op.replace(/\'/g, "")}`
                }).join(", ")}")`
            }
        }

        return `.where(${EntityConditionBuilder(t)})`;
    },

    "orderby": (t) => {
        return `.orderBy("${makeFieldName(t.field)}")`;
    },

    "limit": (t) => {
        if (t == 1) {
            return `.queryFirst()`;
        }
        return `.queryList()`;
    }
}

const EntityDynamicQuery = {
    "select": (t) => {
        if (t.fields.length) {
            let fields = [];
            for (let f of t.fields) {
                fields.push(`"${f.table ? f.table + "." : ""}${makeFieldName(f.field)}"`);
            }
            return `.select(${fields.join(', ')})`
        }
        return "";
    },

    "from": (t) => {
        return `.from("${t.alias}", ${makeTableName(t.table)}")`;
    },

    "innerjoin": (t) => {
        return `.innerJoin("${t.alias}", ${makeTableName(t.table)}")`;
    },

    "fullouterjoin": (t) => {
        return `.outerJoin("${t.alias}", ${makeTableName(t.table)}")`;
    },

    "where": (t) => {
        if (!t.ops || !t.ops.length) {
            return "";
        }
        if (t.op == "and" && t.ops.map(o => typeof o).join(" ").indexOf("object") == -1) {
            let cond = [];
            let isSimple = true;
            for (let o of t.ops) {
                let condition = expandCondition(o);
                if (condition.function != "eq") {
                    isSimple = false;
                }
                cond.push(condition);
            }
            if (isSimple) {
                return `.where("${cond.map(c => {
                    return `${makeFieldName(c.ops[0].op)}", "${c.ops[1].op.replace(/\'/g, "")}`
                }).join(", ")}")`
            }
        }

        return `.where(${EntityConditionBuilder(t)})`;
    },

    "orderby": (t) => {
        return `.orderBy("${t.table ? t.table + "." : ""}${makeFieldName(t.field)}")`;
    },

    "limit": (t) => {
        if (t == 1) {
            return `.queryFirst()`;
        }
        return `.queryList()`;
    }
}

function EntityConditionBuilder(t) {
    let out = "EntityConditionBuilder.create()";
    out = parseTree(t, out);

    function parseTree(t, out) {
        if(t.op == "and") out += ".and()"; else out += ".or()";
        for(let o of t.ops) {
            if(typeof o == "string") {
                let c = expandCondition(o);
                out += `.${c.function}(${c.ops.map(op => {
                    if (op.type == "value") return `"${op.op.replace(/\'/g, "")}"`;
                    return `"${makeFieldName(op.op)}"`;
                }).join(", ")})`
            }
        }
        if(t.op == "and") out += ".endAnd()"; else out += ".endOr()";
        return out;
    }

    return out + ".build()";
}

function makeTableName(n) {
    n = snakeToCamel(n);
    n = n[0].toUpperCase() + n.substr(1);
    return n;
}

function makeFieldName(n) {
    return snakeToCamel(n);
}

function snakeToCamel(str) {
    try {
        return str.replace(/_\w/g, (chr) => {
            return chr[1].toUpperCase();
        })
    }
    catch(err) {
        console.log(str);
    }
    return "";
}

function expandCondition(cond) {
    for(let c of conditions) {
        let m = cond.match(c.compact);
        if(m) {
            let out = Object.assign({}, c.expand);
            for(let i = 0; i < c.expand.ops.length; i++) {
                out.ops[i].op = m[(i + 1)];
            }
            return out;
        }
    }
    return false;
}

const conditions = [{
    name: "equals",
    expand: {
        function: "eq",
        ops: [{
            type: "field"
        }, {
            type: "value"
        }]
    },
    compact: /(.+?)=(.+)/
}, {
    name: "not-equals",
    expand: {
        function: "notEq",
        ops: [{
            type: "field"
        }, {
            type: "value"
        }]
    },
    compact: /(.+?)<>(.+)/
}, {
    name: "isnull",
    expand: {
        function: "isNull",
        ops: [{
            type: "field"
        }]
    },
    compact: /(.+?)\.isnull/i
}]