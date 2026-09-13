import type { Scale } from "../../../types"
import { biex } from "./biex"

export const NICE_RAW = [
	-100000, -10000, -1000, 0, 1000, 10000, 100000, 1000000,
]

const SUPERSCRIPTS: Record<string, string> = {
	"0": "\u2070",
	"1": "\u00B9",
	"2": "\u00B2",
	"3": "\u00B3",
	"4": "\u2074",
	"5": "\u2075",
	"6": "\u2076",
	"7": "\u2077",
	"8": "\u2078",
	"9": "\u2079",
}

const toSuperscript = (s: string): string =>
	s
		.split("")
		.map((c) => SUPERSCRIPTS[c] ?? c)
		.join("")

export const fmtTick = (raw: number): string => {
	if (raw === 0) return "0"
	const abs = Math.abs(raw)
	const exp = Math.round(Math.log10(abs))
	if (10 ** exp === abs) {
		const sign = raw < 0 ? "-" : ""
		return `${sign}10${toSuperscript(String(exp))}`
	}
	return String(raw)
}

/** Em biex, gera ticks em unidades reais posicionados no espaço transformado. */
export const buildTicks = (
	edges: number[] | undefined,
	scale: Scale,
	cof: number,
): { tickvals: number[]; ticktext: string[] } | undefined => {
	if (scale !== "biex" || !edges || edges.length < 2) return undefined
	const min = edges[0]
	const max = edges[edges.length - 1]
	const tickvals: number[] = []
	const ticktext: string[] = []
	for (const raw of NICE_RAW) {
		const t = biex(raw, cof)
		if (t >= min && t <= max) {
			tickvals.push(t)
			ticktext.push(fmtTick(raw))
		}
	}
	return tickvals.length ? { tickvals, ticktext } : undefined
}
