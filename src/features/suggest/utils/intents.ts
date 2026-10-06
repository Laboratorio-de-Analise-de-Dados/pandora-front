import type { GateTool } from "../../plot/hooks/usePlotState"
import type { SuggestIntent, SuggestionGateType } from "../../../types"

/**
 * Intenções de sugestão em vocabulário de laboratório (FE-42 §2) — o
 * usuário diz *o que procura*, nunca o algoritmo. A escolha de modelo e
 * hiperparâmetros é interna ao Juvia (JV-04).
 */
export interface IntentOption {
	value: SuggestIntent
	/** Rótulo curto exibido no select do popover. */
	label: string
	/** Descrição de uma linha — ajuda a escolher sem jargão de ML. */
	description: string
	/** Tipo de saída que a intenção produz naturalmente. */
	preferredGateType: SuggestionGateType
	/** Modo controle exige seleção de arquivo(s) de referência. */
	needsControl: boolean
}

export const SUGGEST_INTENTS: IntentOption[] = [
	{
		value: "separate",
		label: "Separar populações",
		description: "Encontra as populações que existem neste par de canais",
		preferredGateType: "polygon",
		needsControl: false,
	},
	{
		value: "positive_negative",
		label: "Positivos vs. negativos",
		description: "Divide a população em dois grupos (marcador +/-)",
		preferredGateType: "polygon",
		needsControl: false,
	},
	{
		value: "quadrant",
		label: "Análise de quadrantes",
		description: "Cruz que separa os quatro quadrantes do par de canais",
		preferredGateType: "quadrant",
		needsControl: false,
	},
	{
		value: "rare",
		label: "Isolar populações raras",
		description: "Procura populações pequenas fora do grupo principal",
		preferredGateType: "polygon",
		needsControl: false,
	},
	{
		value: "control",
		label: "Limite a partir de controle",
		description: "Usa uma amostra de referência para definir o corte",
		preferredGateType: "quadrant",
		needsControl: true,
	},
]

export const intentByValue = (value: SuggestIntent): IntentOption =>
	SUGGEST_INTENTS.find((i) => i.value === value) ?? SUGGEST_INTENTS[0]

/**
 * Canais de morfologia (FSC/SSC) vs. fluorescência — decide que tipo de
 * controle cada eixo precisa no modo "limite por controle" (FE-42 §3):
 * fluorescente pede FMO/isotípico do canal; FSC×SSC pede controle de
 * população (referência do experimento).
 */
export const isMorphologyChannel = (channel: string): boolean =>
	/^(FSC|SSC)/i.test(channel.trim())

export const isFluorescenceChannel = (channel: string): boolean =>
	!isMorphologyChannel(channel)

/** Tipo de controle que um eixo pede, para orientar o select. */
export type ControlKind = "population" | "fluorescence"

export const controlKindForChannel = (channel: string): ControlKind =>
	isFluorescenceChannel(channel) ? "fluorescence" : "population"

/**
 * Ferramenta de gate ativa → tipo de saída pré-selecionado no popover
 * (FE-42 §2: revisável, mas o default segue o que o usuário já estava
 * usando para desenhar).
 */
export const gateTypeForTool = (tool: GateTool): SuggestionGateType =>
	tool === "quad" ? "quadrant" : tool === "poly" ? "polygon" : "rectangle"
