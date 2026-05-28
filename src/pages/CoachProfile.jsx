import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function CoachProfile({ userId, onBack }) {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [specialities, setSpecialities] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data)
      setName(data.name || '')
      setBio(data.bio || '')
      setSpecialities(data.specialities || '')
      setQualifications(data.qualifications || '')
      setYearsExperience(data.years_experience || '')
      setPhone(data.phone || '')
      setInstagram(data.instagram || '')
      setLocation(data.location || '')
    } else {
      setEditing(true)
    }
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase
      .from('coach_profiles')
      .upsert({
        id: userId,
        name, bio, specialities, qualifications,
        years_experience: parseInt(yearsExperience) || 0,
        phone, instagram, location
      })

    if (error) { alert('Error saving: ' + error.message); setSaving(false); return }
    await loadProfile()
    setEditing(false)
    setSaving(false)
  }

  if (loading) return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
      Loading profile...
    </div>
  )

  const shareLink = `${window.location.origin}/coach/${userId}`

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>

      {/* Header */}
      <div style={{ padding: '56px 20px 16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
        <div style={{ fontSize: '18px', fontWeight: '800' }}>Coach Profile</div>
      </div>

      <div style={{ padding: '0 20px 40px 20px' }}>

        {/* Avatar + name card */}
        <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: editing ? '24px' : '0' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1D9E75, #0a5c43)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: '800', color: 'white', flexShrink: 0,
              border: '3px solid #1D9E75'
            }}>
              {(name || profile?.name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              {editing ? null : (
                <>
                  <div style={{ fontSize: '22px', fontWeight: '800' }}>{profile?.name || 'No name set'}</div>
                  <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                    {profile?.years_experience > 0 ? `${profile.years_experience} yrs exp` : ''}
                    {profile?.location ? ` · 📍 ${profile.location}` : ''}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ padding: '4px 12px', backgroundColor: 'rgba(29,158,117,0.15)', color: '#1D9E75', borderRadius: '20px', fontSize: '11px', fontWeight: '600', border: '1px solid rgba(29,158,117,0.3)' }}>
                      🎯 Coach
                    </span>
                  </div>
                </>
              )}
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #333', borderRadius: '10px', color: '#aaa', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div>
              {/* Edit form */}
              {[
                { label: 'Full name', value: name, set: setName, placeholder: 'e.g. Sarah Johnson', type: 'text' },
                { label: 'Location', value: location, set: setLocation, placeholder: 'e.g. Sydney, NSW', type: 'text' },
                { label: 'Years of experience', value: yearsExperience, set: setYearsExperience, placeholder: 'e.g. 5', type: 'number' },
                { label: 'Phone (optional)', value: phone, set: setPhone, placeholder: 'e.g. 0400 000 000', type: 'text' },
                { label: 'Instagram (optional)', value: instagram, set: setInstagram, placeholder: '@yourhandle', type: 'text' },
              ].map((field, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell students about yourself..." style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Specialities</label>
                <input value={specialities} onChange={e => setSpecialities(e.target.value)} placeholder="e.g. Strength, HIIT, Yoga (comma separated)" style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qualifications</label>
                <textarea value={qualifications} onChange={e => setQualifications(e.target.value)} placeholder="e.g. Cert IV in Fitness, CrossFit Level 2..." style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={saveProfile} disabled={saving} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  {saving ? 'Saving...' : '✓ Save profile'}
                </button>
                {profile && (
                  <button onClick={() => setEditing(false)} style={{ padding: '14px 20px', backgroundColor: 'transparent', border: '1px solid #222', borderRadius: '12px', color: '#555', fontSize: '14px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              {profile?.bio && (
                <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.7', marginTop: '16px', marginBottom: '0' }}>{profile.bio}</p>
              )}
            </div>
          )}
        </div>

        {!editing && (
          <>
            {/* Specialities */}
            {profile?.specialities && (
              <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Specialities</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.specialities.split(',').map((s, i) => (
                    <span key={i} style={{ padding: '5px 12px', backgroundColor: 'rgba(29,158,117,0.15)', color: '#1D9E75', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(29,158,117,0.3)' }}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Qualifications */}
            {profile?.qualifications && (
              <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Qualifications</div>
                <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.6', margin: 0 }}>{profile.qualifications}</p>
              </div>
            )}

            {/* Contact */}
            {(profile?.phone || profile?.instagram) && (
              <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Contact</div>
                {profile.phone && <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '8px' }}>📞 {profile.phone}</div>}
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#1D9E75', textDecoration: 'none' }}>
                    📸 {profile.instagram}
                  </a>
                )}
              </div>
            )}

            {/* Share profile */}
            <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1a1a1a' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Share your profile</div>
              <div style={{ padding: '10px 14px', backgroundColor: '#0a0a0a', borderRadius: '10px', fontSize: '12px', color: '#555', marginBottom: '12px', wordBreak: 'break-all', border: '1px solid #1a1a1a' }}>
                {shareLink}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => { navigator.clipboard.writeText(shareLink); alert('Link copied!') }} style={{ padding: '8px 16px', fontSize: '12px', cursor: 'pointer', borderRadius: '10px', border: '1px solid #222', backgroundColor: '#0a0a0a', color: '#aaa', fontWeight: '500' }}>
                  📋 Copy link
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent('Book a session with me on CoachFlow: ' + shareLink)}`} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', fontSize: '12px', cursor: 'pointer', borderRadius: '10px', border: '1px solid #25D366', backgroundColor: '#25D366', color: 'white', textDecoration: 'none', fontWeight: '500' }}>
                  💬 WhatsApp
                </a>
                <a href={`sms:?body=${encodeURIComponent('Book a session with me on CoachFlow: ' + shareLink)}`} style={{ padding: '8px 16px', fontSize: '12px', cursor: 'pointer', borderRadius: '10px', border: '1px solid #222', backgroundColor: '#0a0a0a', color: '#aaa', textDecoration: 'none', fontWeight: '500' }}>
                  📱 SMS
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CoachProfile