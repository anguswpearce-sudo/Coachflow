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
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>CoachFlow</h1>
      <p>Sign in to continue</p>

      <div style={{ marginTop: '30px' }}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '10px', width: '300px', fontSize: '16px' }}
        />
      </div>

      <div style={{ marginTop: '10px' }}>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', width: '300px', fontSize: '16px' }}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            padding: '10px 40px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#1D9E75',
            color: 'white',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Don't have an account?{' '}
          <span
            onClick={onSwitch}
            style={{ color: '#1D9E75', cursor: 'pointer', fontWeight: '500' }}
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  )
}

export default Login