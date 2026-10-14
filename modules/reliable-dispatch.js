// A retry reuses the exact operation id and revision; never replay at a newer revision.
export async function reliableDispatch(
	call,
	request,
	wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
) {
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			return await call(request);
		} catch (error) {
			if (error.code === "CONFLICT" || attempt === 2) {
				const confirmed = await call({ action: "read" }).catch(
					() => null,
				);
				if (
					confirmed?.state?.operations?.some(
						(item) => item.id === request.operationId,
					)
				)
					return confirmed;
			}
			if (!error.retryable || attempt === 2) {
 if (error.retryable) error.message = "连接暂时不稳定，保存结果未确认，请重试或刷新核对";
 throw error;
 }
			await wait([400, 1000][attempt]);
		}
	}
}
