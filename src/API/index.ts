import axios from "axios"

export const API_BASE_URL =
	import.meta.env.VITE_API_URL || "http://localhost:8085"
const pandoraUrl = API_BASE_URL

const CytometryApi = axios.create({ baseURL: pandoraUrl })

CytometryApi.interceptors.request.use((config) => {
	const token = localStorage.getItem("access_token")
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

CytometryApi.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true
			const refreshToken = localStorage.getItem("refresh_token")
			if (!refreshToken) {
				localStorage.removeItem("access_token")
				localStorage.removeItem("refresh_token")
				return Promise.reject(error)
			}
			try {
				const res = await axios.post(`${pandoraUrl}/accounts/refresh/`, {
					refresh: refreshToken,
				})
				localStorage.setItem("access_token", res.data.access)
				originalRequest.headers.Authorization = `Bearer ${res.data.access}`
				return CytometryApi(originalRequest)
			} catch {
				localStorage.removeItem("access_token")
				localStorage.removeItem("refresh_token")
				window.location.href = "/login"
			}
		}
		return Promise.reject(error)
	},
)

export default CytometryApi
