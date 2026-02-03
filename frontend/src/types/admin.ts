export interface Dashboard {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
}

export interface User {
  id: string
  username: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}
export interface Report {
  id: number
  email: string
  message: string
  createdAt: string
}
