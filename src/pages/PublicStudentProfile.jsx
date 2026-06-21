import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'

function PublicStudentProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [personalBests, setPersonalBests] = useState([])

  const achievements = [
    { id: 1, emoji: '🏅', title: 'First session', description: 'Completed first session', requirement: 1, type: 'sessions' },
    { id: 2, emoji: '⭐', title: 'Getting started', description: 'Completed 5 sessions', requirement: 5, type: 'sessions' },
    { id: 3, emoji: '🔥', title: 'On fire', description: 'Completed 10 sessions', requirement: 10, type: 'sessions' },
    { id: 4, emoji: '💪', title: 'Dedicated', description: 'Completed 25 sessions', requirement: 25, type: 'sessions' },
    { id: 5, emoji: '🏆', title: 'Champion', description: 'Completed 50 sessions', requirement: 50, type: 'sessions' },
    { id: 6, emoji: '📅', title: 'Week warrior', description: '7 day streak', requirement: 7, type: 'streak' },
    { id: 7, emoji: '🌟', title: 'Month master', description: '30 day streak', requirement: 30, type: 'streak' },
  ]

  useEffect(() => { loadProfile() }, [id])

  async function loadProfile() {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) { setNotFound(true); setLoading(false); return }
    setProfile(data)

    // Load personal bests
    const { data: pbs } = await supabase
      .from('personal_bests')
      .select('*')
      .eq('student_id', id)
      .order('achieved_at', { ascending: false })
    setPersonalBests(pbs || [])
    setLoading(false)
  }

  function isUnlocked(achievement) {
    if (!profile) return false
    if (achievement.type === 'sessions') return (profile.sessions_completed || 0) >= achievement.requirement
    if (achievement.type === 'streak') return (profile.current_streak || 0) >= achievement.requirement
    return false
  }

  // Group PBs by exercise, show best per exercise
  const groupedBests = {}
  personalBests.forEach(pb => {
    if (!groupedBests[pb.exercise]) groupedBests[pb.exercise] = pb
    else {
      const lowerIsBetter = ['min', 'sec'].includes(pb.unit)
      if (lowerIsBetter ? pb.value < groupedBests[pb.exercise].value : pb.value > groupedBests[pb.exercise].value) {
        groupedBests[pb.exercise] = pb
      }
    }
  })

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
        <div style={{ fontSize: '14px', color: '#555' }}>This student profile doesn't exist or has been removed.</div>
        <a href="/" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 24px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
          Go to CoachFlow
        </a>
      </div>
    </div>
  )

  const unlockedCount = achievements.filter(a => isUnlocked(a)).length

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

        {/* Profile card */}
        <div style={{ backgroundColor: '#111', borderRadius: '24px', padding: '32px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #4338ca)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: '800', color: 'white', flexShrink: 0,
              border: '3px solid #6366f1'
            }}>
              {(profile.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>{profile.name || 'Athlete'}</div>
              <div style={{ fontSize: '13px', color: '#555' }}>
                {profile.sport && `🏅 ${profile.sport}`}
                {profile.location && ` · 📍 ${profile.location}`}
                {profile.age && ` · ${profile.age} yrs`}
              </div>
              <div style={{ marginTop: '10px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(99,102,241,0.3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  ⚡ Athlete
                </span>
              </div>
            </div>
          </div>

          {profile.bio && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>About</div>
              <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.7', margin: 0 }}>{profile.bio}</p>
            </div>
          )}

          {profile.goals && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Goals</div>
              <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.6', margin: 0 }}>{profile.goals}</p>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { label: 'Sessions', value: profile.sessions_completed || 0, icon: '🏋️' },
              { label: 'Streak', value: `${profile.current_streak || 0}d`, icon: '🔥' },
              { label: 'Badges', value: `${unlockedCount}/${achievements.length}`, icon: '🏅' },
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#0a0a0a', borderRadius: '14px', padding: '14px 10px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{stat.icon}</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>{stat.value}</div>
                <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Bests */}
        {Object.keys(groupedBests).length > 0 && (
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>🏆 Personal Bests</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {Object.entries(groupedBests).map(([exercise, pb]) => (
                <div key={exercise} style={{ backgroundColor: '#0a0a0a', borderRadius: '12px', padding: '14px', border: '1px solid #1a1a1a' }}>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>{exercise}</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#1D9E75' }}>{pb.value}<span style={{ fontSize: '12px', fontWeight: '500', color: '#555', marginLeft: '2px' }}>{pb.unit}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Achievements</div>
          <div style={{ fontSize: '13px', color: '#444', marginBottom: '16px' }}>{unlockedCount} of {achievements.length} unlocked</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px' }}>
            {achievements.map((achievement) => {
              const unlocked = isUnlocked(achievement)
              return (
                <div key={achievement.id} style={{ padding: '14px 8px', borderRadius: '14px', border: `1px solid ${unlocked ? 'rgba(99,102,241,0.4)' : '#1a1a1a'}`, backgroundColor: unlocked ? 'rgba(99,102,241,0.1)' : '#0a0a0a', textAlign: 'center', opacity: unlocked ? 1 : 0.4 }}>
                  <div style={{ fontSize: '26px', marginBottom: '6px' }}>{unlocked ? achievement.emoji : '🔒'}</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: unlocked ? '#818cf8' : '#555', marginBottom: '3px' }}>{achievement.title}</div>
                  <div style={{ fontSize: '10px', color: '#444', lineHeight: '1.3' }}>{achievement.description}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Join banner */}
        <div style={{ background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)', borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>Join CoachFlow</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Track your training and show off your progress</div>
          </div>
          <a href="/" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #4ECCA3, #1D9E75)', color: 'white', borderRadius: '12px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Get started
          </a>
        </div>
      </div>
    </div>
  )
}

export default PublicStudentProfile