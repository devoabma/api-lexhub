import axios from 'axios'
import { env } from 'http/_env'

export const API_PROTHEUS_FIN_URL = axios.create({
  baseURL: env.API_PROTHEUS_FIN_URL,
})

export const API_PROTHEUS_DATA_URL = axios.create({
  baseURL: env.API_PROTHEUS_DATA_URL,
})
