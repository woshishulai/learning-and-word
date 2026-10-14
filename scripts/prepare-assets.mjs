import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
await mkdir("static/course/teenager", { recursive: true });
let total = 0;
for (let n = 1; n <= 9; n++) {
	const output = `static/course/teenager/${n}.jpg`;
	// 保留全部画面和原水印，只生成运行用的压缩副本。
	await sharp(`static/img/document1/images/${n}.png`)
		.resize({ width: 1100, withoutEnlargement: true })
		.jpeg({ quality: 76, mozjpeg: true })
		.toFile(output);
	total += (await stat(output)).size;
}
console.log(`9 张课程配图，共 ${(total / 1024).toFixed(0)} KB；原图保持不变。`);
