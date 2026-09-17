import { expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import OrganizationMembers from "."

const members = [
	{
		id: 1,
		user: { id: 10, username: "paulo_moro", email: "paulo@fiocruz.br" },
		role: { name: "org_admin" },
	},
	{
		id: 2,
		user: { id: 11, username: "guilherme", email: "gui@fiocruz.br" },
		role: { name: "member" },
	},
]

const noop = () => Promise.resolve()

test("renderiza cabeçalho das colunas e dados dos membros", () => {
	render(
		<OrganizationMembers
			members={members}
			canManage
			currentUserId={10}
			onChangeRole={noop}
			onRemove={noop}
		/>,
	)
	for (const col of ["Membro", "E-mail", "Papel", "Ações"]) {
		// "Membro" também é o valor exibido pelo Select de papel.
		expect(screen.getAllByText(col).length).toBeGreaterThan(0)
	}
	expect(screen.getByText(/paulo_moro/)).toBeInTheDocument()
	expect(screen.getByText(/\(Você\)/)).toBeInTheDocument()
	expect(screen.getByText("guilherme")).toBeInTheDocument()
	expect(screen.getByText("gui@fiocruz.br")).toBeInTheDocument()
})

test("admin vê select de papel e ações Sair/Remover", () => {
	render(
		<OrganizationMembers
			members={members}
			canManage
			currentUserId={10}
			onChangeRole={noop}
			onRemove={noop}
		/>,
	)
	expect(screen.getByText("Sair")).toBeInTheDocument()
	expect(screen.getByText("Remover")).toBeInTheDocument()
})

test("membro comum vê chip de papel e não vê ações", () => {
	render(
		<OrganizationMembers
			members={members}
			canManage={false}
			currentUserId={11}
			onChangeRole={noop}
			onRemove={noop}
		/>,
	)
	expect(screen.getAllByText("Administrador").length).toBeGreaterThan(0)
	expect(screen.queryByText("Remover")).not.toBeInTheDocument()
	expect(screen.queryByText("Sair")).not.toBeInTheDocument()
})

test("lista vazia mostra mensagem", () => {
	render(
		<OrganizationMembers
			members={[]}
			canManage
			onChangeRole={noop}
			onRemove={noop}
		/>,
	)
	expect(screen.getByText("Nenhum membro ativo.")).toBeInTheDocument()
})
