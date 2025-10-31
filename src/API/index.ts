import axios from "axios"

const pandoraUrl = process.env.API_URL || "http://164.92.239.48:8085"
const CytometryApi = axios.create({ baseURL: pandoraUrl })

export default CytometryApi
