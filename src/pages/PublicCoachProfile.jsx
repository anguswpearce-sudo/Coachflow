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

  useEffect(() => {
    loadProfile()
  }, [id])

  async function loadProfile() {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      setNotFound(true)
    } else {
      setProfile(data)
    }
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
      .insert([{
        coach_id: id,
        sender_name: senderName,
        sender_email: senderEmail,
        message: message
      }])

    if (error) {
      alert('Error sending message: ' + error.message)
      setSending(false)
      return
    }
    setMessageSent(true)
    setSending(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '15px', color: '#888' }}>Loading profile...</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
          <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Profile not found</div>
          <div style={{ fontSize: '15px', color: '#888' }}>This coach profile doesn't exist or has been removed.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5' }}>

      {/* Nav bar */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #eeeeee',
        padding: '0 32px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          <span style={{ color: '#1D9E75' }}>coach</span>
          <span style={{ color: '#1a1a1a' }}>flow</span>
        </div>
        <a href="/" style={{
          padding: '8px 18px',
          cursor: 'pointer',
          borderRadius: '8px',
          border: '1px solid #1D9E75',
          color: '#1D9E75',
          fontSize: '13px',
          fontWeight: '500',
          backgroundColor: 'white',
          textDecoration: 'none'
        }}>
          Sign in
        </a>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Main profile card */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #eee', marginBottom: '16px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', color: 'white', fontWeight: '700', flexShrink: 0
            }}>
              {profile.name ? profile.name[0].toUpperCase() : '?'}
            </div>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 6px 0' }}>
                {profile.name || 'Coach'}
              </h1>
              <div style={{ fontSize: '14px', color: '#888', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {profile.years_experience > 0 && <span>🏋️ {profile.years_experience} years experience</span>}
                {profile.location && <span>📍 {profile.location}</span>}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>About</div>
              <p style={{ fontSize: '15px', color: '#444', lineHeight: '1.7', margin: 0 }}>{profile.bio}</p>
            </div>
          )}

          {/* Specialities */}
          {profile.specialities && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Specialities</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {profile.specialities.split(',').map((s, i) => (
                  <span key={i} style={{ padding: '6px 14px', backgroundColor: '#E1F5EE', color: '#0F6E56', borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {profile.qualifications && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qualifications</div>
              <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.6', margin: 0 }}>{profile.qualifications}</p>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Experience', value: `${profile.years_experience || 0} yrs`, emoji: '🏋️' },
              { label: 'Platform', value: 'CoachFlow', emoji: '✅' },
              { label: 'Status', value: 'Active', emoji: '🟢' },
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#F7F7F5', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.emoji}</div>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowContact(!showContact)}
              style={{
                flex: 1,
                padding: '13px 20px',
                background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                minWidth: '160px'
              }}
            >
              ✉️ Get in touch
            </button>
            <a href="/" style={{
              flex: 1,
              padding: '13px 20px',
              background: 'linear-gradient(135deg, #0F2027, #2C5364)',
              color: 'white',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
              textAlign: 'center',
              minWidth: '160px'
            }}>
              🚀 Start training →
            </a>
          </div>
        </div>

        {/* Contact form */}
        {showContact && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #eee', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '6px' }}>
              Get in touch with {profile.name?.split(' ')[0] || 'this coach'}
            </h2>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
              Fill in the form below and they'll get back to you soon!
            </p>

            {messageSent ? (
              <div style={{ padding: '20px', backgroundColor: '#E1F5EE', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#0F6E56' }}>Message sent!</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  {profile.name?.split(' ')[0]} will get back to you soon.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '6px' }}>Your name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jamie Chen"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '6px' }}>Your email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '6px' }}>Message</label>
                  <textarea
                    placeholder={`Hi ${profile.name?.split(' ')[0] || 'Coach'}, I'm interested in training with you...`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', border: '1px solid #eee',
                      borderRadius: '10px', fontSize: '14px', outline: 'none',
                      minHeight: '120px', resize: 'vertical', fontFamily: 'inherit'
                    }}
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={sending}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {sending ? 'Sending...' : 'Send message →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Instagram link */}
        {profile.instagram && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 24px', border: '1px solid #eee', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '14px', color: '#444' }}>📸 Follow on Instagram</div>
            <a
              href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '7px 16px', backgroundColor: '#f0f0f0', borderRadius: '8px', fontSize: '13px', fontWeight: '500', textDecoration: 'none', color: '#333' }}
            >
              {profile.instagram}
            </a>
          </div>
        )}

      </div>
    </div>
  )
}

export default PublicCoachProfile