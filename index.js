/* jslint node:true */
'use strict';

const fs = require("fs");
const app = require("express")();
const path = require("path");
const bodyParser = require('body-parser');

const parse = require('./app/core/parser').parse;
const tokenize = require('./app/core/tokens').tokenize;
const EntityQuery = require('./app/core/EntityQuery');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
})

app.post("/convert", (req, res) => {
    let parsed = parse(req.body.input);
    let tokens = tokenize(parsed);
    
    fs.writeFile("out.json", JSON.stringify(tokens, null, 4))
    res.json({
        output: EntityQuery.build(tokens)
    })
})

app.listen(5056, () => {
    console.log("Listening on 5056");
})