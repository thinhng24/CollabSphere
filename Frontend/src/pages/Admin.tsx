import { useEffect, useState } from 'react'
import { getDashboard, getUsers } from '../services/admin.service'
import type { Dashboard, User, Report } from '../types/admin'
import '../styles/admin.css'

export default function Admin() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    async function load() {
      try {
        setDashboard(await getDashboard())
        setUsers(await getUsers())
      } catch {
        setError('Bạn không có quyền Admin')
      }
    }
    load()
  }, [])

  useEffect(() => {
  async function loadReports() {
    const res = await fetch('https://localhost:7266/api/admin/reports', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
    setReports(await res.json())
  }

  loadReports()
}, [])

async function deactivateAllUsers() {
  const ok = window.confirm('Bạn có chắc muốn khóa tất cả user không?')
  if (!ok) return

  const res = await fetch(
    'https://localhost:7266/api/admin/deactivate-all-users',
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  )

  if (res.status === 401 || res.status === 403) {
    alert('Phiên đăng nhập hết hạn hoặc bạn không còn quyền Admin')
    return
  }

  if (!res.ok) {
    alert('Không thể khóa user')
    return
  }

  alert('Đã khóa tất cả user')
    window.location.reload() // 🔄 reload lại trang
}

async function activateAllUsers() {
  const ok = window.confirm('Bạn có chắc muốn mở khóa tất cả user không?')
  if (!ok) return

  const res = await fetch(
    'https://localhost:7266/api/admin/users/activate-all',
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  )

  if (res.status === 401 || res.status === 403) {
    alert('Phiên đăng nhập hết hạn hoặc bạn không còn quyền Admin')
    return
  }

  if (!res.ok) {
    alert('Không thể mở khóa user')
    return
  }

  alert('Đã mở khóa tất cả user')
  window.location.reload() // 🔄 reload lại trang
}


  if (error) return <p className="error">{error}</p>
  if (!dashboard) return <p className="loading">Loading...</p>
const username = localStorage.getItem('username') || 'Admin'
  
  return (
  <div className="admin-app">
    {/* Sidebar */}
    <aside className="sidebar">
      <h1 className="logo">CollabSphere</h1>
      <nav>
        <ul>
          <li className="active">Dashboard</li>
          <li>Users</li>
          <li>Projects</li>
        </ul>
      </nav>
    </aside>

    {/* Main */}
    <main className="main">
      {/* Header */}
      <header className="topbar">
        <h2>Admin Dashboard</h2>

        <div className="user-info">
          <span className="avatar">👤</span>
          <span className="username">{username}</span>
        </div>
      </header>

      {/* Stats */}
<section className="cards">
  <div className="card">
    <p>Total Users</p>
    <h3>{dashboard.totalUsers}</h3>
  </div>
  <div className="card">
    <p>Active Users</p>
    <h3>{dashboard.activeUsers}</h3>
  </div>
  <div className="card">
    <p>Inactive Users</p>
    <h3>{dashboard.inactiveUsers}</h3>
  </div>
</section>

<div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
  <button className="danger-btn" onClick={deactivateAllUsers}>
    🔒 Deactivate All Users
  </button>

  <button className="success-btn" onClick={activateAllUsers}>
    🔓 Activate All Users
  </button>
</div>

<section className="reports">
  <h3>User Reports</h3>

  <div className="report-list">
    {reports.map(r => (
      <div key={r.id} className="report-item">
        <strong>{r.email}</strong>
        <p>{r.message}</p>
        <small>{new Date(r.createdAt).toLocaleString()}</small>
      </div>
    ))}
  </div>
</section>

      {/* Users */}
      <section className="users">
        <h3>User List</h3>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  </div>
)

}
