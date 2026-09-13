/**
 * SHA-256 de um File via Web Crypto — usado no dedup de upload (FE-16).
 *
 * Lê o arquivo inteiro em memória (`arrayBuffer`); suficiente para os
 * tamanhos típicos de ZIP/FCS. Se arquivos muito grandes virarem problema,
 * trocar por uma implementação incremental — o contrato (hex lowercase de
 * 64 chars) não muda.
 */
async function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
	if (typeof file.arrayBuffer === "function") return file.arrayBuffer()
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result as ArrayBuffer)
		reader.onerror = () => reject(reader.error)
		reader.readAsArrayBuffer(file)
	})
}

export async function sha256File(file: File): Promise<string> {
	const buffer = await readAsArrayBuffer(file)
	const digest = await crypto.subtle.digest("SHA-256", buffer)
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")
}
