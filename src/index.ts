#!/usr/bin/env node
import fs = require("fs");
import xmldom = require("xmldom");
import { exec } from "./exec";

if (process.argv.length == 3) {
  let filename = process.argv[2];
  fs.readFile(filename, (err, data) => {
    if (err) {
      process.stdout.write(err.message + "\n");
    }
    else {
      var text = data.toString();
      var parser = new xmldom.DOMParser;
      var doc = parser.parseFromString(text, "text/xml");
      if (doc && doc.documentElement.nodeName == "flowchart") {
        exec(doc.documentElement);
      }
      else {
        process.stdout.write("Invalid flowchart file");
      }
    }
  })
}
else {
  process.stdout.write("Usage: flowcmd filename\n")
}
