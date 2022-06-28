var xlsx = require("xlsx");
var fs = require("fs");

var excelFile;
var sheetName;
var firstSheet;

function readExcel(path) {
    excelFile = xlsx.readFile(path);
    sheetName = excelFile.SheetNames[0];
    firstSheet = excelFile.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(firstSheet, { defval: "" });
}

module.exports = readExcel;