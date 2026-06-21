import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'

function PublicCoachProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [message, setMessage] = useState('')
  const [messageSent, setMessageSent] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => { loadProfile() }, [id])

  async function loadProfile() {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) setNotFound(true)
    else setProfile(data)
    setLoading(false)
  }

  async function sendMessage() {
    if (!senderName || !senderEmail || !message) {
      alert('Please fill in all fields!')
      return
    }
    setSending(true)
    const { error } = await supabase
      .from('contact_messages')
      .insert([{ coach_id: id, sender_name: senderName, sender_email: senderEmail, message }])
    if (error) { alert('Error sending message: ' + error.message); setSending(false); return }
    setMessageSent(true)
    setSending(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>
        <span style={{ color: '#1D9E75' }}>coach</span>
        <span style={{ color: 'white' }}>flow</span>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
        <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Profile not found</div>
        <div style={{ fontSize: '14px', color: '#555' }}>This coach profile doesn't exist or has been removed.</div>
        <a href="/" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 24px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
          Go to CoachFlow
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Nav */}
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #111' }}>
        <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          <span style={{ color: '#1D9E75' }}>coach</span>
          <span style={{ color: 'white' }}>flow</span>
        </div>
        <a href="/" style={{ padding: '8px 18px', borderRadius: '10px', border: '1px solid #1D9E75', color: '#1D9E75', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
          Sign in
        </a>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 20px 60px 20px' }}>

        {/* Hero card */}
        <div style={{ backgroundColor: '#111', borderRadius: '24px', padding: '32px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>

          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1D9E75, #0a5c43)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: '800', color: 'white', flexShrink: 0,
              border: '3px solid #1D9E75'
            }}>
              {(profile.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>{profile.name || 'Coach'}</div>
              <div style={{ fontSize: '13px', color: '#555', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {profile.years_experience > 0 && <span>🏋️ {profile.years_experience} yrs exp</span>}
                {profile.location && <span>📍 {profile.location}</span>}
              </div>
              <div style={{ marginTop: '10px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: 'rgba(29,158,117,0.15)', color: '#1D9E75', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(29,158,117,0.3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  🎯 Coach
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>About</div>
              <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.7', margin: 0 }}>{profile.bio}</p>
            </div>
          )}

          {/* Specialities */}
          {profile.specialities && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Specialities</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {profile.specialities.split(',').map((s, i) => (
                  <span key={i} style={{ padding: '5px 12px', backgroundColor: 'rgba(29,158,117,0.1)', color: '#1D9E75', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(29,158,117,0.2)' }}>
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {profile.qualifications && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Qualifications</div>
              <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.6', margin: 0 }}>{profile.qualifications}</p>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
            {[
              { label: 'Experience', value: `${profile.years_experience || 0}y`, icon: '🏋️' },
              { label: 'Platform', value: 'CoachFlow', icon: '✅' },
              { label: 'Status', value: 'Active', icon: '🟢' },
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#0a0a0a', borderRadius: '14px', padding: '14px 10px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{stat.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{stat.value}</div>
                <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowContact(!showContact)}
              style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
            >
              ✉️ Get in touch
            </button>
            <a href="/" style={{ flex: 1, padding: '14px', backgroundColor: '#1a1a1a', color: '#aaa', borderRadius: '14px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', textAlign: 'center', border: '1px solid #222' }}>
              🚀 Join CoachFlow
            </a>
          </div>
        </div>

        {/* Contact form */}
        {showContact && (
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '28px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
              Get in touch with {profile.name?.split(' ')[0] || 'this coach'}
            </div>
            <div style={{ fontSize: '13px', color: '#555', marginBottom: '20px' }}>
              Fill in the form and they'll get back to you soon!
            </div>

            {messageSent ? (
              <div style={{ padding: '24px', backgroundColor: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: '#1D9E75' }}>Message sent!</div>
                <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>{profile.name?.split(' ')[0]} will get back to you soon.</div>
              </div>
            ) : (
              <div>
                {[
                  { label: 'Your name', value: senderName, set: setSenderName, placeholder: 'e.g. Jamie Chen', type: 'text' },
                  { label: 'Your email', value: senderEmail, set: setSenderEmail, placeholder: 'your@email.com', type: 'email' },
                ].map((field, i) => (
                  <div key={i} style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</label>
                    <input type={field.type} placeholder={field.placeholder} value={field.value} onChange={e => field.set(e.target.value)} style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                ))}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Message</label>
                  <textarea
                    placeholder={`Hi ${profile.name?.split(' ')[0] || 'Coach'}, I'm interested in training with you...`}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <button onClick={sendMessage} disabled={sending} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  {sending ? 'Sending...' : 'Send message'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Instagram */}
        {profile.instagram && (
          <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '18px 20px', border: '1px solid #1a1a1a', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '14px', color: '#aaa' }}>📸 Instagram</div>
            <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ padding: '6px 14px', backgroundColor: '#0a0a0a', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', color: '#1D9E75', border: '1px solid #1a1a1a' }}>
              {profile.instagram}
            </a>
          </div>
        )}

        {/* Join banner */}
        <div style={{ background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)', borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>Train with CoachFlow</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>The platform built for serious athletes</div>
          </div>
          <a href="/" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #4ECCA3, #1D9E75)', color: 'white', borderRadius: '12px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Get started
          </a>
        </div>
      </div>
    </div>
  )
}

export default PublicCoachProfile