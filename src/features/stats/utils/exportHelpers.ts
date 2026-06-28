import * as XLSX from "xlsx"

export const downloadFile = (blob: Blob, fileName: string): void => {
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = fileName
	a.click()
	URL.revokeObjectURL(url)
}

export const exportRows = (
	rows: string[][],
	fileName: string,
	format: "csv" | "xlsx",
): void => {
	if (format === "xlsx") {
		const ws = XLSX.utils.aoa_to_sheet(rows)
		const colWidths = rows[0].map((_, i) =>
			Math.max(...rows.map((r) => (r[i]?.length ?? 0))) + 2,
		)
		ws["!cols"] = colWidths.map((w) => ({ wch: Math.min(w, 40) }))
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, "Estatísticas")
		const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" })
		downloadFile(
			new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
			fileName,
		)
	} else {
		const csvContent = "\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
		downloadFile(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }), fileName)
	}
}
