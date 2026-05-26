import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MainLayout from './pages/MainLayout'

function App() {
  const [role, setRole] = useState(null)
  const [page, setPage] = useState('login')
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // When the app loads, check if Supabase already has a logged-in session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Someone is logged in — fetch their role from the profiles table
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
      // Done checking — show the app
      setChecking(false)
    })

    // Also listen for login/logout events happening anywhere in the app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setRole(null)
          setUser(null)
          setPage('login')
        }
      }
    )

    // Clean up the listener when the component unmounts
    return () => subscription.unsubscribe()
  }, [])

  function handleSignOut() {
    supabase.auth.signOut()
    setRole(null)
    setUser(null)
    setPage('login')
  }

  // Show a loading screen while we check for an existing session
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>
          <span style={{ color: '#4ECCA3' }}>coach</span>
          <span style={{ color: 'white' }}>flow</span>
        </div>
      </div>
    )
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