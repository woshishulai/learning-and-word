const fields = [
	["term", "单词"],
	["meaning", "词义"],
	["ipa", "音标"],
	["homophone", "谐音提示"],
	["mnemonic", "记忆方法"],
	["example", "例句"],
	["level", "学段"],
	["source", "文章"],
];
export function serializeNotebook(entries, format) {
	const rows = entries.map((w) => ({
		...w,
		level: (w.sources || []).map((s) => s.level).join(" / ") || w.level,
		source: (w.sources || []).map((s) => s.title).join(" / ") || w.source,
	}));
	if (format === "json")
		return JSON.stringify({ version: 1, words: rows }, null, 2);
	if (format === "txt")
		return rows
			.map((w) =>
				fields
					.map(([k, label]) => `${label}：${w[k] || ""}`)
					.join("\r\n"),
			)
			.join("\r\n\r\n");
	if (format !== "csv") throw new Error("不支持的文件格式");
	const cell = (v) => {
		let s = String(v || "");
		if (/^[\s]*[=+\-@]/.test(s)) s = "'" + s;
		return '"' + s.replace(/"/g, '""') + '"';
	};
	return (
		"\uFEFF" +
		[
			fields.map((x) => cell(x[1])).join(","),
			...rows.map((w) => fields.map(([k]) => cell(w[k])).join(",")),
		].join("\r\n")
	);
}
