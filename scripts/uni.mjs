import { spawn } from "node:child_process";
import { resolve } from "node:path";
const mode = process.argv[2] || "dev";
const platform = process.argv[3] || "h5";
const args = [resolve("node_modules/@dcloudio/vite-plugin-uni/bin/uni.js")];
if (mode === "build") args.push("build");
args.push("-p", platform);
if (mode === "dev") args.push("--host", "127.0.0.1", "--port", "5173");
const child = spawn(process.execPath, args, {
	stdio: "inherit",
	env: {
		...process.env,
		UNI_INPUT_DIR: process.cwd(),
		UNI_OUTPUT_DIR: resolve("unpackage", "dist", mode, platform),
	},
});
child.on("exit", (code) => process.exit(code ?? 1));
