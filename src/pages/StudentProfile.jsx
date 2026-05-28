import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function StudentProfile({ userId, onBack }) {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [sport, setSport] = useState('')
  const [age, setAge] = useState('')
  const [location, setLocation] = useState('')
  const [goals, setGoals] = useState('')

  const achievements = [
    { id: 1, emoji: '🏅', title: 'First session', description: 'Completed your first session', requirement: 1, type: 'sessions' },
    { id: 2, emoji: '⭐', title: 'Getting started', description: 'Completed 5 sessions', requirement: 5, type: 'sessions' },
    { id: 3, emoji: '🔥', title: 'On fire', description: 'Completed 10 sessions', requirement: 10, type: 'sessions' },
    { id: 4, emoji: '💪', title: 'Dedicated', description: 'Completed 25 sessions', requirement: 25, type: 'sessions' },
    { id: 5, emoji: '🏆', title: 'Champion', description: 'Completed 50 sessions', requirement: 50, type: 'sessions' },
    { id: 6, emoji: '📅', title: 'Week warrior', description: '7 day streak', requirement: 7, type: 'streak' },
    { id: 7, emoji: '🌟', title: 'Month master', description: '30 day streak', requirement: 30, type: 'streak' },
  ]

  useEffect(() => { loadProfile() }, [])

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
      setSport(data.sport || '')
      setAge(data.age || '')
      setLocation(data.location || '')
      setGoals(data.goals || '')
    } else {
      setEditing(true)
    }
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)

    // Only save age if over 16
    const ageNum = parseInt(age) || 0
    const safeAge = ageNum >= 16 ? ageNum : null

    const { error } = await supabase
      .from('student_profiles')
      .upsert({
        id: userId,
        name, bio, sport,
        age: safeAge,
        location, goals,
      })

    if (error) { alert('Error saving: ' + error.message); setSaving(false); return }
    await loadProfile()
    setEditing(false)
    setSaving(false)
  }

  function isUnlocked(achievement) {
    if (!profile) return false
    if (achievement.type === 'sessions') return (profile.sessions_completed || 0) >= achievement.requirement
    if (achievement.type === 'streak') return (profile.current_streak || 0) >= achievement.requirement
    return false
  }

  if (loading) return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
      Loading profile...
    </div>
  )

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>

      {/* Header */}
      <div style={{ padding: '56px 20px 16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
        <div style={{ fontSize: '18px', fontWeight: '800' }}>My Profile</div>
      </div>

      <div style={{ padding: '0 20px 40px 20px' }}>

        {/* Avatar + info card */}
        <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: editing ? '24px' : '0' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #4338ca)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: '800', color: 'white', flexShrink: 0,
              border: '3px solid #6366f1'
            }}>
              {(name || profile?.name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              {!editing && (
                <>
                  <div style={{ fontSize: '22px', fontWeight: '800' }}>{profile?.name || 'No name set'}</div>
                  <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                    {profile?.sport ? `🏅 ${profile.sport}` : ''}
                    {profile?.location ? ` · 📍 ${profile.location}` : ''}
                    {profile?.age ? ` · ${profile.age} yrs` : ''}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ padding: '4px 12px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: '20px', fontSize: '11px', fontWeight: '600', border: '1px solid rgba(99,102,241,0.3)' }}>
                      ⚡ Athlete
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
              {[
                { label: 'Full name', value: name, set: setName, placeholder: 'e.g. Jamie Chen', type: 'text' },
                { label: 'Sport / discipline', value: sport, set: setSport, placeholder: 'e.g. Rugby, Swimming, CrossFit', type: 'text' },
                { label: 'Location', value: location, set: setLocation, placeholder: 'e.g. Brisbane, QLD', type: 'text' },
                { label: 'Age (must be 16+)', value: age, set: setAge, placeholder: 'e.g. 22', type: 'number' },
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
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Goals</label>
                <textarea value={goals} onChange={e => setGoals(e.target.value)} placeholder="e.g. Build strength, lose weight, improve endurance..." style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell your coach about yourself..." style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={saveProfile} disabled={saving} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #6366f1, #4338ca)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
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
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
              {[
                { label: 'Sessions', value: profile?.sessions_completed || 0, icon: '🏋️' },
                { label: 'Streak', value: `${profile?.current_streak || 0}d`, icon: '🔥' },
                { label: 'Sport', value: profile?.sport || '—', icon: '🏅' },
              ].map((stat, i) => (
                <div key={i} style={{ backgroundColor: '#111', borderRadius: '14px', padding: '16px 12px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Goals */}
            {profile?.goals && (
              <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Goals</div>
                <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.6', margin: 0 }}>{profile.goals}</p>
              </div>
            )}

            {/* Achievements */}
            <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1a1a1a' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Achievements</div>
              <div style={{ fontSize: '12px', color: '#444', marginBottom: '16px' }}>Complete sessions and build streaks to unlock badges</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px' }}>
                {achievements.map((achievement) => {
                  const unlocked = isUnlocked(achievement)
                  return (
                    <div key={achievement.id} style={{
                      padding: '14px 8px',
                      borderRadius: '14px',
                      border: `1px solid ${unlocked ? 'rgba(99,102,241,0.4)' : '#1a1a1a'}`,
                      backgroundColor: unlocked ? 'rgba(99,102,241,0.1)' : '#0a0a0a',
                      textAlign: 'center',
                      opacity: unlocked ? 1 : 0.4,
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ fontSize: '26px', marginBottom: '6px' }}>{unlocked ? achievement.emoji : '🔒'}</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: unlocked ? '#818cf8' : '#555', marginBottom: '3px' }}>{achievement.title}</div>
                      <div style={{ fontSize: '10px', color: '#444', lineHeight: '1.3' }}>{achievement.description}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default StudentProfile