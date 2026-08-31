export const ACCEPTED_EXPERIMENT_EXTENSIONS = [".fcs", ".zip"] as const

export const ACCEPTED_EXPERIMENT_FILE_ACCEPT =
	ACCEPTED_EXPERIMENT_EXTENSIONS.join(",")

export const ACCEPTED_EXPERIMENT_FILE_MESSAGE =
	"Apenas arquivos .fcs ou .zip são aceitos."

export function isAcceptedExperimentFile(fileName: string): boolean {
	const name = fileName.trim().toLowerCase()
	return ACCEPTED_EXPERIMENT_EXTENSIONS.some((ext) => name.endsWith(ext))
}
