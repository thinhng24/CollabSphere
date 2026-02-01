const API_URL = 'https://localhost:7266/api/admin'

function getToken() {
  return localStorage.getItem('token')
}

export async function getDashboard() {
  const res = await fetch(`${API_URL}/dashboard`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })

  if (!res.ok) {
    throw new Error('Unauthorized')
  }

  return await res.json()
}

export async function getUsers() {
  const res = await fetch(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })

  if (!res.ok) {
    throw new Error('Unauthorized')
  }

  return await res.json()
}
