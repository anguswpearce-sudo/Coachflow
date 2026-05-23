import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function StudentProfile({ userId, onBack }) {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')

  const achievements = [
    { id: 1, emoji: '🏅', title: 'First session', description: 'Completed your first session', requirement: 1, type: 'sessions' },
    { id: 2, emoji: '⭐', title: 'Getting started', description: 'Completed 5 sessions', requirement: 5, type: 'sessions' },
    { id: 3, emoji: '🔥', title: 'On fire', description: 'Completed 10 sessions', requirement: 10, type: 'sessions' },
    { id: 4, emoji: '💪', title: 'Dedicated', description: 'Completed 25 sessions', requirement: 25, type: 'sessions' },
    { id: 5, emoji: '🏆', title: 'Champion', description: 'Completed 50 sessions', requirement: 50, type: 'sessions' },
    { id: 6, emoji: '📅', title: 'Week warrior', description: '7 day streak', requirement: 7, type: 'streak' },
    { id: 7, emoji: '🌟', title: 'Month master', description: '30 day streak', requirement: 30, type: 'streak' },
  ]

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data)
      setName(data.name || '')
      setBio(data.bio || '')
    } else {
      setEditing(true)
    }
    setLoading(false)
  }

  async function saveProfile() {
    const { error } = await supabase
      .from('student_profiles')
      .upsert({
        id: userId,
        name,
        bio,
      })

    if (error) {
      alert('Error saving: ' + error.message)
      return
    }

    loadProfile()
    setEditing(false)
  }

  function isUnlocked(achievement) {
    if (!profile) return false
    if (achievement.type === 'sessions') {
      return (profile.sessions_completed || 0) >= achievement.requirement
    }
    if (achievement.type === 'streak') {
      return (profile.current_streak || 0) >= achievement.requirement
    }
    return false
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
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>My Profile</h1>
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
                placeholder="e.g. Jamie Chen"
                style={{ display: 'block', width: '100%', marginTop: '5px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell your coach about yourself..."
                style={{ display: 'block', width: '100%', marginTop: '5px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minHeight: '80px', resize: 'vertical' }}
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
                <div style={{ fontSize: '14px', color: '#666' }}>🏋️ {profile?.sessions_completed || 0} sessions completed</div>
                <div style={{ fontSize: '14px', color: '#666' }}>🔥 {profile?.current_streak || 0} day streak</div>
              </div>
            </div>

            {profile?.bio && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '4px' }}>About</div>
                <div style={{ fontSize: '14px' }}>{profile.bio}</div>
              </div>
            )}

            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#666'
            }}>
           🔗 Share your profile: <strong>{window.location.origin}/student/{userId}</strong>
            </div>
          </div>
        )}
      </div>

      <div style={{
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '30px'
      }}>
        <h2 style={{ marginBottom: '6px' }}>Achievements</h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Complete sessions and build streaks to unlock badges!
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {achievements.map((achievement) => {
            const unlocked = isUnlocked(achievement)
            return (
              <div
                key={achievement.id}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: `1px solid ${unlocked ? '#1D9E75' : '#ddd'}`,
                  backgroundColor: unlocked ? '#E1F5EE' : '#f9f9f9',
                  textAlign: 'center',
                  opacity: unlocked ? 1 : 0.5
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {unlocked ? achievement.emoji : '🔒'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                  {achievement.title}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {achievement.description}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StudentProfile