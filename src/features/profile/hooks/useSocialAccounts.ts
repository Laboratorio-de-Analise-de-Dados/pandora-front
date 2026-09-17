import { useQuery } from "@tanstack/react-query"
import { fetchSocialAccounts } from "../../../services/authService"

export const SOCIAL_ACCOUNTS_QUERY_KEY = ["social-accounts"]

/** Vínculos de IdP ativos do usuário logado (BE-29 / seção "Contas
 * conectadas" do perfil). */
export function useSocialAccounts() {
	return useQuery({
		queryKey: SOCIAL_ACCOUNTS_QUERY_KEY,
		queryFn: fetchSocialAccounts,
	})
}
