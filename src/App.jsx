import { useState } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MainLayout from './pages/MainLayout'

function App() {
  const [role, setRole] = useState(null)
  const [page, setPage] = useState('login')
  const [user, setUser] = useState(null)

  function handleSignOut() {
    setRole(null)
    setUser(null)
    setPage('login')
  }

  if (role === 'coach' || role === 'student') {
    return <MainLayout userId={user} role={role} onSignOut={handleSignOut} />
  }

  if (page === 'signup') {
    return <Signup onSwitch={() => setPage('login')} />
  }

  return (
    <Login
      onLogin={(role, userId) => {
        setRole(role)
        setUser(userId)
      }}
      onSwitch={() => setPage('signup')}
    />
  )
}

export default App