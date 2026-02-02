import { useState } from 'react'
import { login } from '../services/auth.service'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import '../styles/auth.css'

export default function Login() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await login({ username, password })
      localStorage.setItem('token', res.token)
      localStorage.setItem('username', res.username)
      localStorage.setItem('role', res.role)
      if (res.role === 'Admin') {
        navigate('/admin')
      } else {
        alert('Login thành công')
      }
    } catch {
      setError('Sai tài khoản hoặc mật khẩu')
    }
  }

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2 className="auth-title">Đăng nhập</h2>

        <input
          className="auth-input"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button className="auth-button" type="submit">
          Đăng nhập
        </button>

        {error && <p className="auth-error">{error}</p>}

        <p className="auth-link">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </form>
    </div>
  )
}
