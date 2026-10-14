// HBuilderX 将绑定空间的客户端配置注入编译环境，不在源码中保存密钥。
// 普通 npm 本地预览未注入配置时，继续使用独立的本机体验数据。
export const cloudSpace = {
	provider: "alipay",
	name: "learning-and-word",
	id: "env-00jy6y1rc1sw",
};
let boundSpaces = [];
try {
	boundSpaces = JSON.parse(process.env.UNI_CLOUD_PROVIDER || "[]");
} catch {}
export const storageMode =
	Array.isArray(boundSpaces) &&
	boundSpaces.some(
		(space) =>
			space.provider === cloudSpace.provider &&
			space.spaceId === cloudSpace.id,
	)
		? "cloud"
		: "local";
