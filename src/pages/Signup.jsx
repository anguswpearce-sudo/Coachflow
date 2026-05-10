import { useState } from 'react'
import { supabase } from '../supabase'

function Signup({ onSwitch }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSignup() {
    if (email === '' || password === '') {
      alert('Please fill in all fields!')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) {
      setMessage('Error: ' + error.message)
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, email: email, role: role }])

    if (profileError) {
      setMessage('Error saving profile: ' + profileError.message)
      setLoading(false)
      return
    }

    setMessage('Account created! Please check your email to confirm your account, then sign in!')
    setLoading(false)
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>CoachFlow</h1>
      <p>Create your account</p>

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
          placeholder="Choose a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', width: '300px', fontSize: '16px' }}
        />
      </div>

      <div style={{ marginTop: '10px' }}>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ padding: '10px', width: '322px', fontSize: '16px' }}
        >
          <option value="student">I am a Student</option>
          <option value="coach">I am a Coach</option>
        </select>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={handleSignup}
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
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </div>

      {message && (
        <div style={{
          marginTop: '20px',
          padding: '12px 20px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #1D9E75',
          borderRadius: '8px',
          maxWidth: '300px',
          margin: '20px auto 0',
          fontSize: '14px',
          color: '#1D9E75'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Already have an account?{' '}
          <span
            onClick={onSwitch}
            style={{ color: '#1D9E75', cursor: 'pointer', fontWeight: '500' }}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  )
}

export default Signup