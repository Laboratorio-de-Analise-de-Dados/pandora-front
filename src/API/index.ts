import axios from "axios"

const pandoraUrl = import.meta.env.VITE_API_URL || "http://localhost:8085"
// const pandoraUrl = import.meta.env.VITE_API_URL || "https://api.project-pandora.com.br"
const CytometryApi = axios.create({ baseURL: pandoraUrl })

export default CytometryApi
