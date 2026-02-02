import axios from 'axios'

const API_URL = 'https://localhost:7266/api/auth'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export async function login(data: LoginRequest) {
  const res = await axios.post(`${API_URL}/login`, data)
  return res.data
}

export async function register(data: RegisterRequest) {
  const res = await axios.post(`${API_URL}/register`, data)
  return res.data
}
