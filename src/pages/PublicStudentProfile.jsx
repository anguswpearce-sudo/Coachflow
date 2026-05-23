import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'

function PublicStudentProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const achievements = [
    { id: 1, emoji: '🏅', title: 'First session', description: 'Completed first session', requirement: 1, type: 'sessions' },
    { id: 2, emoji: '⭐', title: 'Getting started', description: 'Completed 5 sessions', requirement: 5, type: 'sessions' },
    { id: 3, emoji: '🔥', title: 'On fire', description: 'Completed 10 sessions', requirement: 10, type: 'sessions' },
    { id: 4, emoji: '💪', title: 'Dedicated', description: 'Completed 25 sessions', requirement: 25, type: 'sessions' },
    { id: 5, emoji: '🏆', title: 'Champion', description: 'Completed 50 sessions', requirement: 50, type: 'sessions' },
    { id: 6, emoji: '📅', title: 'Week warrior', description: '7 day streak', requirement: 7, type: 'streak' },
    { id: 7, emoji: '🌟', title: 'Month master', description: '30 day streak', requirement: 30, type: 'streak' },
  ]

  useEffect(() => {
    loadProfile()
  }, [id])

  async function loadProfile() {
    const { data, error } = await supabase
      .from('student_profiles')
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

  function isUnlocked(achievement) {
    if (!profile) return false
    if (achievement.type === 'sessions') return (profile.sessions_completed || 0) >= achievement.requirement
    if (achievement.type === 'streak') return (profile.current_streak || 0) >= achievement.requirement
    return false
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
          <div style={{ fontSize: '15px', color: '#888' }}>This student profile doesn't exist or has been removed.</div>
        </div>
      </div>
    )
  }

  const unlockedCount = achievements.filter(a => isUnlocked(a)).length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5' }}>

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

        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #eee',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
              fontWeight: '700',
              flexShrink: 0
            }}>
              {profile.name ? profile.name[0].toUpperCase() : '?'}
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>
                {profile.name || 'Student'}
              </h1>
              <div style={{ fontSize: '14px', color: '#888' }}>
                🏋️ {profile.sessions_completed || 0} sessions · 🔥 {profile.current_streak || 0} day streak
              </div>
            </div>
          </div>

          {profile.bio && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>About</div>
              <p style={{ fontSize: '15px', color: '#444', lineHeight: '1.6', margin: 0 }}>{profile.bio}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Sessions', value: profile.sessions_completed || 0, emoji: '🏋️' },
              { label: 'Day streak', value: profile.current_streak || 0, emoji: '🔥' },
              { label: 'Achievements', value: `${unlockedCount}/${achievements.length}`, emoji: '🏅' },
            ].map((stat, i) => (
              <div key={i} style={{
                backgroundColor: '#F7F7F5',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{stat.emoji}</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #eee',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '6px' }}>Achievements</h2>
          <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
            {unlockedCount} of {achievements.length} unlocked
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {achievements.map((achievement) => {
              const unlocked = isUnlocked(achievement)
              return (
                <div key={achievement.id} style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${unlocked ? '#1D9E75' : '#eee'}`,
                  backgroundColor: unlocked ? '#E1F5EE' : '#f9f9f9',
                  textAlign: 'center',
                  opacity: unlocked ? 1 : 0.5
                }}>
                  <div style={{ fontSize: '30px', marginBottom: '8px' }}>
                    {unlocked ? achievement.emoji : '🔒'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '3px' }}>{achievement.title}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>{achievement.description}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>Join CoachFlow</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '2px' }}>Track your training and show off your progress</div>
          </div>
          <a href="/" style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #4ECCA3, #1D9E75)',
            color: 'white',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}>
            Get started →
          </a>
        </div>

      </div>
    </div>
  )
}

export default PublicStudentProfile