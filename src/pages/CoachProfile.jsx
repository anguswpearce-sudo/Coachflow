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
        years_experience: parseInt(yearsExperience) || 0
      })

    if (error) {
      alert('Error saving: ' + error.message)
      return
    }

    loadProfile()
    setEditing(false)
  }

  if (loading) return <div style={{ padding: '40px' }}>Loading profile...</div>

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
          fontSize: '14px'
        }}
      >
        ← Back to dashboard
      </button>

      <div style={{
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '30px',
      }}>
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
                fontSize: '14px'
              }}
            >
              Edit profile
            </button>
          )}
        </div>

        {editing ? (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Johnson"
                style={{ display: 'block', width: '100%', marginTop: '5px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell students about yourself..."
                style={{ display: 'block', width: '100%', marginTop: '5px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>Specialities</label>
              <input
                type="text"
                value={specialities}
                onChange={(e) => setSpecialities(e.target.value)}
                placeholder="e.g. Strength training, HIIT, Yoga"
                style={{ display: 'block', width: '100%', marginTop: '5px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>Qualifications & certifications</label>
              <textarea
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g. Cert IV in Fitness, CrossFit Level 2..."
                style={{ display: 'block', width: '100%', marginTop: '5px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>Years of experience</label>
              <input
                type="number"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                placeholder="e.g. 5"
                style={{ display: 'block', width: '100%', marginTop: '5px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={saveProfile}
                style={{
                  padding: '10px 25px',
                  backgroundColor: '#1D9E75',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Save profile
              </button>
              {profile && (
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    padding: '10px 25px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                backgroundColor: '#1D9E75',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                color: 'white',
                fontWeight: '500'
              }}>
                {profile?.name ? profile.name[0].toUpperCase() : '?'}
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '500' }}>{profile?.name || 'No name set'}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>🏋️ {profile?.years_experience || 0} years experience</div>
              </div>
            </div>

            {profile?.bio && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '4px' }}>About</div>
                <div style={{ fontSize: '14px' }}>{profile.bio}</div>
              </div>
            )}

            {profile?.specialities && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>Specialities</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.specialities.split(',').map((s, i) => (
                    <span key={i} style={{
                      padding: '4px 12px',
                      backgroundColor: '#E1F5EE',
                      color: '#0F6E56',
                      borderRadius: '20px',
                      fontSize: '13px'
                    }}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile?.qualifications && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '4px' }}>Qualifications</div>
                <div style={{ fontSize: '14px' }}>{profile.qualifications}</div>
              </div>
            )}

            <div style={{
              marginTop: '20px',
              padding: '12px 16px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#666'
            }}>
              🔗 Share your profile link: <strong>coachflow-six.vercel.app/coach/{profile?.name?.toLowerCase().replace(/ /g, '-') || 'your-name'}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoachProfile