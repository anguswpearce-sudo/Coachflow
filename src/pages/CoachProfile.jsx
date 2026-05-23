import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function CoachProfile({ userId, onBack }) {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [specialities, setSpecialities] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

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
    const { error } = await supabase
      .from('coach_profiles')
      .upsert({
        id: userId,
        name,
        bio,
        specialities,
        qualifications,
        years_experience: parseInt(yearsExperience) || 0,
        phone,
        instagram,
        location
      })

    if (error) {
      alert('Error saving: ' + error.message)
      return
    }

    loadProfile()
    setEditing(false)
  }

  if (loading) return <div style={{ padding: '40px' }}>Loading profile...</div>

  const shareLink = `${window.location.origin}/coach/${userId}`

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
      <button
        onClick={onBack}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          cursor: 'pointer',
          borderRadius: '8px',
          border: '1px solid #ddd',
          fontSize: '14px',
          backgroundColor: 'white'
        }}
      >
        Back to dashboard
      </button>

      <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>Coach Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '8px 20px',
                cursor: 'pointer',
                borderRadius: '8px',
                border: '1px solid #1D9E75',
                color: '#1D9E75',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              Edit profile
            </button>
          )}
        </div>

        {editing ? (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '5px' }}>Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Johnson"
                style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '5px' }}>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell students about yourself..."
                style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minHeight: '80px', resize: 'vertical', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '5px' }}>Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Sydney, NSW"
                style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '5px' }}>Specialities</label>
              <input type="text" value={specialities} onChange={(e) => setSpecialities(e.target.value)} placeholder="e.g. Strength training, HIIT, Yoga"
                style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '5px' }}>Qualifications</label>
              <textarea value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder="e.g. Cert IV in Fitness, CrossFit Level 2..."
                style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minHeight: '80px', resize: 'vertical', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '5px' }}>Years of experience</label>
              <input type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="e.g. 5"
                style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '5px' }}>Phone number (optional)</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0400 000 000"
                style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '5px' }}>Instagram handle (optional)</label>
              <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="e.g. @coachsarah"
                style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={saveProfile}
                style={{ padding: '10px 25px', backgroundColor: '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                Save profile
              </button>
              {profile && (
                <button onClick={() => setEditing(false)}
                  style={{ padding: '10px 25px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: 'white' }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '70px', height: '70px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', color: 'white', fontWeight: '500'
              }}>
                {profile?.name ? profile.name[0].toUpperCase() : '?'}
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '500' }}>{profile?.name || 'No name set'}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {profile?.years_experience || 0} years experience
                  {profile?.location && ` · ${profile.location}`}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '4px' }}>About</div>
                <div style={{ fontSize: '14px' }}>{profile.bio}</div>
              </div>
            )}

            {/* Specialities */}
            {profile?.specialities && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>Specialities</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.specialities.split(',').map((s, i) => (
                    <span key={i} style={{ padding: '4px 12px', backgroundColor: '#E1F5EE', color: '#0F6E56', borderRadius: '20px', fontSize: '13px' }}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Qualifications */}
            {profile?.qualifications && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '4px' }}>Qualifications</div>
                <div style={{ fontSize: '14px' }}>{profile.qualifications}</div>
              </div>
            )}

            {/* Contact info */}
            {(profile?.phone || profile?.instagram) && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>Contact</div>
                {profile.phone && (
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>📞 {profile.phone}</div>
                )}
                {profile.instagram && (
                  <div style={{ fontSize: '14px' }}>
                    📸{' '}
                    <a
                      href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#1D9E75', textDecoration: 'none' }}
                    >
                      {profile.instagram}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Share your profile link */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginTop: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>Share your profile</div>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#F7F7F5',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#888',
                marginBottom: '10px',
                wordBreak: 'break-all'
              }}>
                {shareLink}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { navigator.clipboard.writeText(shareLink); alert('Link copied!') }}
                  style={{ padding: '7px 14px', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: 'white' }}
                >
                  📋 Copy link
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent('Book a session with me on CoachFlow: ' + shareLink)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '7px 14px', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #25D366', backgroundColor: '#25D366', color: 'white', textDecoration: 'none' }}
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`sms:?body=${encodeURIComponent('Book a session with me on CoachFlow: ' + shareLink)}`}
                  style={{ padding: '7px 14px', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: 'white', textDecoration: 'none', color: '#333' }}
                >
                  📱 SMS
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoachProfile