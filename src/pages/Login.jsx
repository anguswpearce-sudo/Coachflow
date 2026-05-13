import { useState } from 'react'
import { supabase } from '../supabase'

function Login({ onLogin, onSwitch }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    if (email === '' || password === '') {
      alert('Please fill in all fields!')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    if (profile) {
      onLogin(profile.role, data.user.id)
    } else {
      alert('Could not find your profile. Please try again!')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>
            <span style={{ color: '#4ECCA3' }}>coach</span>
            <span style={{ color: 'white' }}>flow</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '15px' }}>
            Welcome back! Sign in to continue
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '36px'
        }}>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '8px'
            }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                fontSize: '14px',
                color: 'white',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                fontSize: '14px',
                color: 'white',
                outline: 'none',
              }}
            />
          </div>

          <button
            onClick={handleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: 'linear-gradient(135deg, #4ECCA3, #1D9E75)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              letterSpacing: '0.3px'
            }}
          >
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>

          <p style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.4)'
          }}>
            Don't have an account?{' '}
            <span
              onClick={onSwitch}
              style={{ color: '#4ECCA3', cursor: 'pointer', fontWeight: '500' }}
            >
              Sign up
            </span>
          </p>
        </div>

      </div>
    </div>
  )
}

export default Login