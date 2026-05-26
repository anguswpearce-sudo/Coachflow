import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function ProfileTab({ userId, role, onSignOut }) {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [specialities, setSpecialities] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [instagram, setInstagram] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => { loadProfile() }, [userId])

  async function loadProfile() {
    setLoading(true)
    const table = role === 'coach' ? 'coach_profiles' : 'student_profiles'
    const { data } = await supabase.from(table).select('*').eq('id', userId).single()
    if (data) {
      setProfile(data)
      setName(data.name || '')
      setBio(data.bio || '')
      setLocation(data.location || '')
      setSpecialities(data.specialities || '')
      setQualifications(data.qualifications || '')
      setYearsExperience(data.years_experience || '')
      setInstagram(data.instagram || '')
      setPhone(data.phone || '')
    } else {
      setEditing(true)
    }
    setLoading(false)
  }

  async function saveProfile() {
    const table = role === 'coach' ? 'coach_profiles' : 'student_profiles'
    const payload = role === 'coach'
      ? { id: userId, name, bio, location, specialities, qualifications, years_experience: parseInt(yearsExperience) || 0, instagram, phone }
      : { id: userId, name, bio, location }

    const { error } = await supabase.from(table).upsert(payload)
    if (error) { alert('Error saving: ' + error.message); return }
    loadProfile()
    setEditing(false)
  }

  const shareLink = role === 'coach' ? `${window.location.origin}/coach/${userId}` : null

  if (loading) return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#555', fontSize: '15px' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>

      {/* Header */}
      <div style={{ padding: '56px 20px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Profile</div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{ padding: '8px 16px', backgroundColor: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '10px', color: '#1D9E75', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ padding: '0 20px 32px 20px' }}>
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #1a1a1a', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>Edit Profile</div>

            {[
              { label: 'Full name', value: name, set: setName, placeholder: 'Your name' },
              { label: 'Location', value: location, set: setLocation, placeholder: 'e.g. Sydney, NSW' },
              ...(role === 'coach' ? [
                { label: 'Specialities', value: specialities, set: setSpecialities, placeholder: 'e.g. Strength, HIIT, Yoga' },
                { label: 'Years experience', value: yearsExperience, set: setYearsExperience, placeholder: 'e.g. 5', type: 'number' },
                { label: 'Instagram', value: instagram, set: setInstagram, placeholder: '@yourhandle' },
                { label: 'Phone', value: phone, set: setPhone, placeholder: '0400 000 000' },
              ] : []),
            ].map((field, i) => (
              <div key={i} style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{field.label}</label>
                <input
                  type={field.type || 'text'}
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', minHeight: '80px', fontFamily: 'inherit' }}
              />
            </div>

            {role === 'coach' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Qualifications</label>
                <textarea
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g. Cert IV in Fitness..."
                  style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={saveProfile} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Save</button>
              {profile && <button onClick={() => setEditing(false)} style={{ padding: '14px 20px', backgroundColor: 'transparent', border: '1px solid #222', borderRadius: '12px', color: '#555', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 20px 32px 20px' }}>

          {/* Avatar + name */}
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #1a1a1a', marginBottom: '12px', textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1D9E75, #0a5c43)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: '800', color: 'white',
              margin: '0 auto 16px auto',
              border: '3px solid #1D9E75'
            }}>
              {(profile?.name || '?')[0]?.toUpperCase()}
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{profile?.name || 'No name set'}</div>
            <div style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>
              {profile?.years_experience > 0 && `${profile.years_experience} yrs exp · `}
              {profile?.location && `📍 ${profile.location}`}
            </div>
            <span style={{
              padding: '6px 14px',
              backgroundColor: role === 'coach' ? 'rgba(29,158,117,0.15)' : 'rgba(99,102,241,0.15)',
              color: role === 'coach' ? '#1D9E75' : '#818cf8',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              border: `1px solid ${role === 'coach' ? 'rgba(29,158,117,0.3)' : 'rgba(99,102,241,0.3)'}`,
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              {role === 'coach' ? '🎯 Coach' : '⚡ Athlete'}
            </span>
          </div>

          {profile?.bio && (
            <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '18px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>About</div>
              <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.7', margin: 0 }}>{profile.bio}</p>
            </div>
          )}

          {profile?.specialities && (
            <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '18px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Specialities</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {profile.specialities.split(',').map((s, i) => (
                  <span key={i} style={{ padding: '5px 12px', backgroundColor: 'rgba(29,158,117,0.1)', color: '#1D9E75', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(29,158,117,0.2)' }}>{s.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {/* Share link (coaches only) */}
          {shareLink && (
            <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '18px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Share Profile</div>
              <div style={{ fontSize: '12px', color: '#444', marginBottom: '10px', wordBreak: 'break-all' }}>{shareLink}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { navigator.clipboard.writeText(shareLink); alert('Copied!') }} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '10px', color: '#1D9E75', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>📋 Copy</button>
                <a href={`https://wa.me/?text=${encodeURIComponent('Book with me: ' + shareLink)}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '10px', color: '#25D366', fontSize: '12px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' }}>💬 WhatsApp</a>
              </div>
            </div>
          )}

          <button onClick={onSignOut} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: '1px solid #222', borderRadius: '14px', color: '#555', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileTab