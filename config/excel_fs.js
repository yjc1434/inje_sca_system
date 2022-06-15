const { json } = require("body-parser");
var xlsx = require("xlsx");

var excelFile = xlsx.readFile('db/list.xlsx');
var sheetName = excelFile.SheetNames[0];
var firstSheet = excelFile.Sheets[sheetName];

var jsonDB = xlsx.utils.sheet_to_json(firstSheet, { defval: "" });

module.exports = jsonDB;