import { useState } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CoachDashboard from './pages/CoachDashboard'
import StudentDashboard from './pages/StudentDashboard'

function App() {
  const [role, setRole] = useState(null)
  const [page, setPage] = useState('login')
  const [user, setUser] = useState(null)

  function handleSignOut() {
    setRole(null)
    setUser(null)
    setPage('login')
  }

  if (role === 'coach') {
    return <CoachDashboard onSignOut={handleSignOut} userId={user} />
  }

  if (role === 'student') {
    return <StudentDashboard onSignOut={handleSignOut} userId={user} />
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