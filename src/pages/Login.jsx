import { useState } from 'react'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSignIn() {
    if (email === 'coach@test.com') {
      onLogin('coach')
    } else if (email === 'student@test.com') {
      onLogin('student')
    } else {
      alert('Try coach@test.com or student@test.com')
    }
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
          style={{ padding: '10px 40px', fontSize: '16px', cursor: 'pointer' }}
        >
          Sign in
        </button>
      </div>
    </div>
  )
}

export default Login