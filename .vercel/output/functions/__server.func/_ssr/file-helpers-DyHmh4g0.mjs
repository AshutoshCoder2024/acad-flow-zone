//#region node_modules/.nitro/vite/services/ssr/assets/file-helpers-DyHmh4g0.js
async function fileToBase64(file) {
	const buffer = await file.arrayBuffer();
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}
//#endregion
export { fileToBase64 as t };
