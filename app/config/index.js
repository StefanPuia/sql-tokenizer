/* jslint node:true */
'use strict';

module.exports = {
    tokens: ["select", "from", "where", "inner join", "full outer join", "order by", "limit"],
    operators: [{
        name: "equals",
        sql: "=",
        expand: /(.+?) = (.+?)/g,
        compact: "$1=$2"
    }, {
        name: "not-equals",
        sql: "<>",
        expand: /(.+?) <> (.+?)/g,
        compact: "$1<>$2"
    }, {
        name: "isnull",
        sql: "isnull",
        expand: /(.+?) isnull/gi,
        compact: "$1.isnull"
    }]
}