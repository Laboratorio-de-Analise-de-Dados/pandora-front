import type { ExperimentFiles, Subsample } from "../../../types"
import { defaultScale } from "../../plot/utils/biex"

/**
 * Atribuição de amostras aos controles do cálculo de compensação
 * (FE-39): uma linha de negativo + uma por canal fluorescente, cada
 * uma apontando amostras (réplicas entram juntas no pool do backend).
 */
export interface ControlAssignment {
	negative: number[]
	controls: Record<string, number[]>
}

/** Canais de fluorescência — espelha `fluorescent_channels` do backend
 * (ADR-0018): tudo que não é FSC/SSC/Time. */
export const fluorescentChannels = (values: string[]): string[] =>
	values.filter((v) => v && defaultScale(v) !== "linear")

/** Token do canal para casar com nome de arquivo: "PE-Cy7-A" → "PECY7". */
const channelToken = (channel: string): string =>
	channel
		.replace(/-[ahw]$/i, "")
		.replace(/[^a-z0-9]/gi, "")
		.toUpperCase()

const normalizeName = (name: string): string =>
	name.replace(/[^a-z0-9]/gi, "").toUpperCase()

/** Marcas de controle negativo no nome ("unstained", "negative"). */
const NEGATIVE_TOKENS = ["UNSTAIN", "NEGATIVE"]

export const fileMatchesChannel = (
	file: ExperimentFiles,
	channel: string,
): boolean => {
	const token = channelToken(channel)
	return token.length > 0 && normalizeName(file.file_name).includes(token)
}

export const fileMatchesNegative = (file: ExperimentFiles): boolean =>
	NEGATIVE_TOKENS.some((t) => normalizeName(file.file_name).includes(t))

/** Ordem do dropdown da linha: quem casa com o nome primeiro, o resto
 * na ordem natural das amostras. */
export const sortFilesForRow = (
	files: ExperimentFiles[],
	matches: (f: ExperimentFiles) => boolean,
): ExperimentFiles[] => {
	const hit: ExperimentFiles[] = []
	const rest: ExperimentFiles[] = []
	for (const f of files) (matches(f) ? hit : rest).push(f)
	return [...hit, ...rest]
}

/**
 * Sugestão inicial do modal: subsamples já marcados como controle
 * preenchem as linhas; nos canais que sobrarem, tenta o nome do arquivo
 * (tokens mais longos primeiro — "APCCY7" reclama o arquivo antes de
 * "APC"). Uma amostra nunca ocupa duas linhas.
 */
export const suggestControlAssignments = (
	files: ExperimentFiles[],
	channels: string[],
	subsamples: Subsample[],
): ControlAssignment => {
	const used = new Set<number>()
	const negative: number[] = []
	const controls: Record<string, number[]> = {}

	for (const sub of subsamples) {
		const ids = files
			.filter((f) => f.subsample === sub.id && !used.has(f.id))
			.map((f) => f.id)
		if (!ids.length) continue
		if (sub.control_type === "unstained" && !negative.length) {
			negative.push(...ids)
		} else if (
			sub.control_type === "single_stain" &&
			sub.control_channel &&
			!controls[sub.control_channel]?.length
		) {
			controls[sub.control_channel] = ids
		} else {
			continue
		}
		ids.forEach((id) => used.add(id))
	}

	if (!negative.length) {
		const hit = files.find((f) => !used.has(f.id) && fileMatchesNegative(f))
		if (hit) {
			negative.push(hit.id)
			used.add(hit.id)
		}
	}

	const byTokenLength = [...channels].sort(
		(a, b) => channelToken(b).length - channelToken(a).length,
	)
	for (const channel of byTokenLength) {
		if (controls[channel]?.length) continue
		const hit = files.find(
			(f) => !used.has(f.id) && fileMatchesChannel(f, channel),
		)
		if (hit) {
			controls[channel] = [hit.id]
			used.add(hit.id)
		}
	}

	return { negative, controls }
}

/** Validação mínima espelhando o backend (`compute_spillover_matrix`):
 * negativo obrigatório, ≥2 canais com controle, amostra não repetida. */
export const validateControlAssignment = (
	assignment: ControlAssignment,
): string | null => {
	if (!assignment.negative.length)
		return "Escolha ao menos uma amostra como controle negativo."
	const covered = Object.values(assignment.controls).filter(
		(ids) => ids.length > 0,
	)
	if (covered.length < 2) return "Selecione controles para pelo menos 2 canais."
	const seen = new Set<number>()
	for (const id of [...assignment.negative, ...covered.flat()]) {
		if (seen.has(id))
			return "Uma mesma amostra não pode ser controle de dois papéis."
		seen.add(id)
	}
	return null
}

/** Canais sem controle — aviso no sumário, não erro (matriz parcial). */
export const uncoveredChannels = (
	assignment: ControlAssignment,
	channels: string[],
): string[] => channels.filter((c) => !assignment.controls[c]?.length)

/** Ids já em uso nas outras linhas — o dropdown desabilita essas opções. */
export const assignedFileIds = (
	assignment: ControlAssignment,
	exceptKey?: string,
): Set<number> => {
	const used = new Set<number>()
	if (exceptKey !== "negative")
		assignment.negative.forEach((id) => used.add(id))
	for (const [channel, ids] of Object.entries(assignment.controls))
		if (channel !== exceptKey) ids.forEach((id) => used.add(id))
	return used
}
