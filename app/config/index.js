/* jslint node:true */
'use strict';

module.exports = {
    tokens: ["select", "from", "where", "inner join", "full outer join", "order by", "limit", "group by"],
    operators: [{
        name: "equals",
        sql: "=",
        expand: /(.+?) = (.+?)/g,
        compact: "$1|=|$2"
    }, {
        name: "not-equals",
        sql: "<>",
        expand: /(.+?) <> (.+?)/g,
        compact: "$1|<>|$2"
    }, {
        name: "lt",
        sql: "<",
        expand: /(.+?) < (.+?)/g,
        compact: "$1|<|$2"
    }, {
        name: "lteq",
        sql: "<=",
        expand: /(.+?) <= (.+?)/g,
        compact: "$1|<=|$2"
    }, {
        name: "gt",
        sql: ">",
        expand: /(.+?) > (.+?)/g,
        compact: "$1|>|$2"
    }, {
        name: "gteq",
        sql: ">=",
        expand: /(.+?) >= (.+?)/g,
        compact: "$1|>=|$2"
    }, {
        name: "isnull",
        sql: "isnull",
        expand: /(.+?) isnull/gi,
        compact: "$1|isnull|"
    }, {
        name: "not-like",
        sql: "not like",
        expand: /(.+?) not like (.+)/gi,
        compact: "$1|notlike|$2"
    }, {
        name: "like",
        sql: "like",
        expand: /(.+?) like (.+)/gi,
        compact: "$1|like|$2"
    }, {
        name: "between",
        sql: "between",
        expand: /(.+?) between (.+?) and (.+)/gi,
        compact: "$1|between|$2|$3"
    }],
    input: `
select 
    so.sales_opportunity_id,
    so.opportunity_stage_id
    -- concat(ul.user_login_id, ' (', p.party_id, ') - ',  p.first_name, ' ', p.last_name, ' : ',  so.created_stamp) as created

from sales_opportunity as so
inner join user_login as ul
    on ul.user_login_id = so.created_by_user_login
inner join person as p
    on p.party_id = ul.party_id

where
    so.created_stamp >= '2018-09-03 00:00:00'
    and so.created_stamp <= '2018-09-03 23:59:59'
    and so.description not like '%HOME%'
    and so.created_by_user_login = 'PrinceT01'
    -- and so.created_by_user_login in (
    --     select distinct ul.user_login_id
    --     from party_role as pr
    --     inner join user_login as ul on pr.party_id = ul.party_id
    --     where pr.role_type_id in ('SALES_ADVISOR_IB', 'SALES_ADVISOR')
    -- )
`
}