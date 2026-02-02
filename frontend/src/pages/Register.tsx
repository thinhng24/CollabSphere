import { useState } from 'react'
import { register } from '../services/auth.service'
import { useNavigate } from 'react-router-dom'
import '../styles/auth.css'

export default function Register() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,14}$/
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,14}$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!usernameRegex.test(username)) {
      return setError('Username phải 6–14 ký tự, gồm chữ và số')
    }

    if (!emailRegex.test(email)) {
      return setError('Email không đúng định dạng (vd: text@text.com)')
    }

    if (!passwordRegex.test(password)) {
      return setError('Mật khẩu phải 6–14 ký tự, gồm chữ và số')
    }

    if (password !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp')
    }

    try {
      await register({ username, email, password })
      alert('Đăng ký thành công')
      navigate('/login')
    } catch {
      setError('Đăng ký thất bại, vui lòng thử lại')
    }
  }

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2 className="auth-title">Đăng ký</h2>

        <input
          className="auth-input"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />

        <input
          className="auth-input"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />

        <button className="auth-button" type="submit">
          Đăng ký
        </button>

        {error && <p className="auth-error">{error}</p>}
      </form>
    </div>
  )
}
