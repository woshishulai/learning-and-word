import { serializeNotebook } from "../modules/export-notebook.js";
export async function exportNotebook(entries, format) {
	if (!entries.length) throw new Error("当前范围没有生词");
	const content = serializeNotebook(entries, format),
		name = `wordscape-${Date.now()}.${format}`;
	// #ifdef H5
	const url = URL.createObjectURL(
		new Blob([content], {
			type:
				format === "json"
					? "application/json;charset=utf-8"
					: "text/plain;charset=utf-8",
		}),
	);
	const link = document.createElement("a");
	link.href = url;
	link.download = name;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 30000);
	return name;
	// #endif
	// #ifdef APP-PLUS
	if (typeof plus === "undefined" || !plus.io)
		throw new Error("App 文件服务尚未就绪，请稍后重试");
	return new Promise((resolve, reject) =>
		plus.io.requestFileSystem(
			plus.io.PRIVATE_DOC,
			(fs) =>
				fs.root.getFile(
					name,
					{ create: true, exclusive: true },
					(entry) =>
						entry.createWriter((writer) => {
							writer.onwrite = () => {
								const path = entry.toLocalURL();
								uni.showModal({
									title: "文件已导出",
									content: path,
									confirmText: "打开文件",
									success: (r) => {
										if (r.confirm)
											plus.runtime.openFile(
												path,
												{},
												() =>
													uni.showToast({
														title: "设备没有可打开此格式的应用",
														icon: "none",
													}),
											);
									},
								});
								resolve(path);
							};
							writer.onerror = reject;
							writer.write(content);
						}, reject),
					reject,
				),
			reject,
		),
	);
	// #endif
	// #ifndef H5
	// #ifndef APP-PLUS
	throw new Error("请在网页版或 App 导出文件");
	// #endif
	// #endif
}
