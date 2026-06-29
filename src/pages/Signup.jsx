import { useState } from 'react'
import { supabase } from '../supabase'

function Signup({ onSwitch, onSignupComplete }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleSignup() {
    if (email === '' || password === '' || confirmPassword === '') {
      setMessage('Please fill in all fields!')
      setIsError(true)
      return
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match!')
      setIsError(true)
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters!')
      setIsError(true)
      return
    }

    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) {
      setMessage('Error: ' + error.message)
      setIsError(true)
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, email: email, role: role }])

    if (profileError) {
      setMessage('Error saving profile: ' + profileError.message)
      setIsError(true)
      setLoading(false)
      return
    }

    // Auto sign in
    await supabase.auth.signInWithPassword({ email, password })

    // Hand off to onboarding
    onSignupComplete(role, data.user.id)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>
            <span style={{ color: '#4ECCA3' }}>coach</span>
            <span style={{ color: 'white' }}>flow</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '15px' }}>
            Create your account
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Email address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: '14px', color: 'white', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: '14px', color: 'white', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Confirm password</label>
            <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignup()} style={{ width: '100%', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: '14px', color: 'white', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>I am a...</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div onClick={() => setRole('student')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${role === 'student' ? '#4ECCA3' : 'rgba(255,255,255,0.15)'}`, backgroundColor: role === 'student' ? 'rgba(78,204,163,0.15)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center', color: role === 'student' ? '#4ECCA3' : 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: '500', transition: 'all 0.15s' }}>
                🎓 Student
              </div>
              <div onClick={() => setRole('coach')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${role === 'coach' ? '#4ECCA3' : 'rgba(255,255,255,0.15)'}`, backgroundColor: role === 'coach' ? 'rgba(78,204,163,0.15)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center', color: role === 'coach' ? '#4ECCA3' : 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: '500', transition: 'all 0.15s' }}>
                🏋️ Coach
              </div>
            </div>
          </div>

          <button onClick={handleSignup} disabled={loading} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #4ECCA3, #1D9E75)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: loading ? 'default' : 'pointer', letterSpacing: '0.3px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating account...' : 'Create account →'}
          </button>

          {message && (
            <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: isError ? 'rgba(244,63,94,0.15)' : 'rgba(78,204,163,0.15)', border: `1px solid ${isError ? 'rgba(244,63,94,0.3)' : 'rgba(78,204,163,0.3)'}`, borderRadius: '10px', fontSize: '13px', color: isError ? '#f43f5e' : '#4ECCA3', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            Already have an account?{' '}
            <span onClick={onSwitch} style={{ color: '#4ECCA3', cursor: 'pointer', fontWeight: '500' }}>Sign in</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup