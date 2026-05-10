import { useState } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CoachDashboard from './pages/CoachDashboard'
import StudentDashboard from './pages/StudentDashboard'

function App() {
  const [role, setRole] = useState(null)
  const [page, setPage] = useState('login')

  function handleSignOut() {
    setRole(null)
    setPage('login')
  }

  if (role === 'coach') {
    return <CoachDashboard onSignOut={handleSignOut} />
  }

  if (role === 'student') {
    return <StudentDashboard onSignOut={handleSignOut} />
  }

  if (page === 'signup') {
    return <Signup onSwitch={() => setPage('login')} />
  }

  return (
    <Login
      onLogin={setRole}
      onSwitch={() => setPage('signup')}
    />
  )
}

export default App