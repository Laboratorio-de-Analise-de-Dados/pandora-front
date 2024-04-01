import axios from 'axios';

const CytometryApi = axios.create({baseURL:process.env.CYTOMETRY_API_ENDPOINT})

export default CytometryApi