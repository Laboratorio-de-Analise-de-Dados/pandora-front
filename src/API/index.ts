import axios from 'axios';

const CytometryApi = axios.create({baseURL:'http://localhost:8000'})

export default CytometryApi