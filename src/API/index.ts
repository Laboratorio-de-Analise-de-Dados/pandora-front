import axios from "axios"

const pandoraUrl = process.env.API_URL || "http://localhost:8085"
// const pandoraUrl = process.env.API_URL || "https://api.project-pandora.com.br"
const CytometryApi = axios.create({ baseURL: pandoraUrl })

export default CytometryApi
