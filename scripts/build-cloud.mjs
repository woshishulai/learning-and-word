import { build } from "esbuild";
await build({
	entryPoints: ["server/learning-api.js"],
	bundle: true,
	platform: "node",
	target: "node16",
	format: "cjs",
	outfile: "uniCloud-alipay/cloudfunctions/learning-api/index.js",
});
console.log("learning-api 云函数已生成");
