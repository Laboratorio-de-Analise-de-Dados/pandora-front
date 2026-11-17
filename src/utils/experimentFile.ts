export const ACCEPTED_EXPERIMENT_EXTENSIONS = [".fcs", ".zip"] as const

export const ACCEPTED_EXPERIMENT_FILE_ACCEPT =
	ACCEPTED_EXPERIMENT_EXTENSIONS.join(",")

export const ACCEPTED_EXPERIMENT_FILE_MESSAGE =
	"Apenas arquivos .fcs ou .zip são aceitos."

export function isAcceptedExperimentFile(fileName: string): boolean {
	const name = fileName.trim().toLowerCase()
	return ACCEPTED_EXPERIMENT_EXTENSIONS.some((ext) => name.endsWith(ext))
}

/** Nomes de arquivo repetidos numa seleção (comparação case-insensitive,
 * como o filesystem/back enxerga colisão). Retorna os nomes duplicados
 * na forma original — sem repetição. */
export function findDuplicateFileNames(
	files: File[],
	keyOf: (file: File) => string = (file) => file.name,
): string[] {
	const seen = new Map<string, string>()
	const duplicates = new Map<string, string>()
	for (const file of files) {
		const key = keyOf(file).trim().toLowerCase()
		const original = seen.get(key)
		if (original !== undefined) {
			duplicates.set(key, original)
		} else {
			seen.set(key, file.name)
		}
	}
	return [...duplicates.values()]
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	const units = ["KB", "MB", "GB"]
	let value = bytes
	let unit = "B"
	for (const next of units) {
		if (value < 1024) break
		value /= 1024
		unit = next
	}
	return `${value.toFixed(1)} ${unit}`
}

/** Caminho relativo de um arquivo selecionado via `webkitdirectory`
 * (FE-54): `webkitRelativePath` inclui a pasta raiz escolhida
 * (`Pasta/sub/a.fcs`) — o backend (BE-49) espera o caminho **dentro**
 * dela (`sub/a.fcs`). Retorna `undefined` para arquivo solto ou na
 * raiz da pasta (cai em "Sem subsample"). */
export function fileRelativePath(file: File): string | undefined {
	const raw = file.webkitRelativePath
	if (!raw) return undefined
	const segments = raw.split("/").filter(Boolean)
	if (segments.length <= 2) return undefined
	return segments.slice(1).join("/")
}

/** Chave de unicidade de um item de upload (FE-54): arquivos de pasta
 * com mesmo basename em subdiretórios diferentes são amostras
 * distintas — a chave é o caminho relativo quando existe. */
export function fileUploadKey(file: File): string {
	return (fileRelativePath(file) ?? file.name).trim().toLowerCase()
}
