/* global __dirname, require, module */
/* eslint complexity: 0*/
/* eslint no-console: 0*/
"use strict";

const path = require("path");
const glob = require("glob");
const fs = require("fs");
const prettier = require("prettier");
const hljs = require("highlight.js");
const makeDir = require("make-dir");

const dir = path.join(__dirname, "/../../stories");

function beautifyFile(codeString) {
	const code = prettier
		.format(
			`<prettier>${codeString.replace(/{" "}/g, "").replace(/<br \/>/g, "")}</prettier>`,
			{
				trailingComma: "es5",
				printWidth: 70,
			}
		)
		.replace("<prettier>", "")
		.replace("</prettier>", "")
		.replace(/;\n$/, "")
		.replace(/^\n/, "")
		.replace(/^ {2}/gm, "");
	return hljs.highlight("xml", code).value;
}

function getFiles() {
	return glob.sync(`${dir}/**/*.js`, {
		ignore: [`${dir}/Doc/**`, `${dir}/tmp/**`],
	});
}

function extract() {
	const out = ["/* eslint-disable */", "// prettier-ignore", "const exampleCode = {};"];

	getFiles().forEach(filePath => {
		const data = fs.readFileSync(filePath, "utf8");

		data.split("<DocElement ").forEach(dataSpl => {
			const dataSplSpl = dataSpl.split("</DocElement>");
			if (dataSplSpl[0].search(/^id="/) < 0) {
				return;
			}
			const reg = new RegExp('id="([^"]*)">([^]*)', "g");
			const result = reg.exec(dataSplSpl[0]);
			if (!result || !Array.isArray(result) || result.length < 3) {
				return;
			}
			out.push(`exampleCode["${result[1]}"] = \`${beautifyFile(result[2])}\`;`);
		});
	});

	out.push("export default exampleCode;");

	const target = path.join(dir, "/tmp");
	const targetFile = path.join(target, "/code.js");
	makeDir.sync(target);
	fs.writeFileSync(targetFile, out.join("\n"));
	console.log("wrote file: ", targetFile);
}

function watch() {
	extract();
	getFiles().forEach(filePath => {
		fs.watchFile(filePath, () => {
			extract();
		});
	});
}

module.exports = {
	extract,
	watch,
};