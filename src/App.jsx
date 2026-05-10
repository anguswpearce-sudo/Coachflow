import { useState } from 'react'
import Login from './pages/Login'
import CoachDashboard from './pages/CoachDashboard'
import StudentDashboard from './pages/StudentDashboard'

function App() {
  const [role, setRole] = useState(null)

  function handleSignOut() {
    setRole(null)
  }

  if (role === 'coach') {
    return <CoachDashboard onSignOut={handleSignOut} />
  }

  if (role === 'student') {
    return <StudentDashboard onSignOut={handleSignOut} />
  }

  return (
    <div>
      <Login onLogin={setRole} />
    </div>
  )
}

export default App