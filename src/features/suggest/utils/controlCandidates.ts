import type { ExperimentFiles, Subsample } from "../../../types"
import type { ControlKind } from "./intents"

/**
 * FE-42 §3 — candidatos a controle no modo "limite por controle".
 *
 * Não existe hoje relação estrutural controle↔amostra (o pareamento é
 * roadmap — BE-26/BE-34): o front apenas **ordena** as amostras do
 * experimento para o usuário confirmar — quem aparece primeiro:
 *
 * - controle de fluorescência: single_stain do canal (subsample), FMO
 *   ou isotípico (tags de categoria `control` com system_key fmo/isotype)
 * - controle de população: unstained ou tag de controle biológica
 * - qualquer outra marcação de controle vem antes das amostras comuns
 *
 * A ordenação é uma **sugestão** — o usuário sempre escolhe.
 */

const FLUORESCENCE_CONTROL_KEYS = new Set(["fmo", "isotype"])
const POPULATION_CONTROL_KEYS = new Set(["unstained", "biological"])

/** Pontos que indicam que a amostra é um controle (subsample ou tags). */
const controlScore = (
	file: ExperimentFiles,
	subsamples: Subsample[],
	kind: ControlKind,
	channel?: string,
): number => {
	const subsample = subsamples.find((s) => s.id === file.subsample)
	const controlKeys = (file.tags ?? [])
		.filter((t) => t.category === "control")
		.map((t) => t.system_key)

	// Melhor match: single_stain marcado exatamente para o canal pedido.
	if (
		kind === "fluorescence" &&
		channel &&
		subsample?.control_type === "single_stain" &&
		subsample.control_channel === channel
	)
		return 3

	const relevant =
		kind === "fluorescence"
			? FLUORESCENCE_CONTROL_KEYS
			: POPULATION_CONTROL_KEYS
	if (controlKeys.some((k) => k && relevant.has(k))) return 2
	if (kind === "population" && subsample?.control_type === "unstained") return 2

	// Qualquer outra marcação de controle ainda vem antes das comuns.
	if (controlKeys.length > 0 || subsample?.control_type) return 1
	return 0
}

/** A amostra em tela já é um controle marcado? (aviso contextual do §3). */
export const isControlFile = (
	file: ExperimentFiles | undefined,
	subsamples: Subsample[],
): boolean =>
	!!file &&
	controlScore(file, subsamples, "population") +
		controlScore(file, subsamples, "fluorescence") >
		0

/**
 * Ordena as amostras para o select de controle: marcadas relevantes
 * primeiro, depois outras marcações de controle, depois o resto —
 * estável por nome dentro de cada faixa.
 */
export const orderControlCandidates = (
	files: ExperimentFiles[],
	subsamples: Subsample[],
	kind: ControlKind,
	channel?: string,
): ExperimentFiles[] =>
	[...files]
		.filter((f) => f.active !== false)
		.sort((a, b) => {
			const diff =
				controlScore(b, subsamples, kind, channel) -
				controlScore(a, subsamples, kind, channel)
			return diff !== 0 ? diff : a.file_name.localeCompare(b.file_name)
		})
