import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import MainLayout from './pages/MainLayout'

function App() {
  const [role, setRole] = useState(null)
  const [page, setPage] = useState('login')
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser(session.user.id)
          setRole(profile.role)
        }
      }
      setChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setRole(null)
          setUser(null)
          setPage('login')
          setShowOnboarding(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  function handleSignOut() {
    supabase.auth.signOut()
    setRole(null)
    setUser(null)
    setPage('login')
    setShowOnboarding(false)
  }

  // Called by Signup when account is created successfully
  function handleSignupComplete(newRole, newUserId) {
    setRole(newRole)
    setUser(newUserId)
    setShowOnboarding(true)
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>
          <span style={{ color: '#4ECCA3' }}>coach</span>
          <span style={{ color: 'white' }}>flow</span>
        </div>
      </div>
    )
  }

  // Show onboarding after signup
  if (showOnboarding && user && role) {
    return (
      <Onboarding
        userId={user}
        role={role}
        onComplete={() => setShowOnboarding(false)}
      />
    )
  }

  if (role === 'coach' || role === 'student') {
    return <MainLayout userId={user} role={role} onSignOut={handleSignOut} />
  }

  if (page === 'signup') {
    return (
      <Signup
        onSwitch={() => setPage('login')}
        onSignupComplete={handleSignupComplete}
      />
    )
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