import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function HomeTab({ userId, role, onSignOut, onNavigate }) {
  const [profile, setProfile] = useState(null)
  const [programmes, setProgrammes] = useState([])
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    loadProfile()
    loadProgrammes()
  }, [userId])

  async function loadProfile() {
    if (role === 'coach') {
      const { data } = await supabase.from('coach_profiles').select('*').eq('id', userId).single()
      setProfile(data)
    } else {
      const { data } = await supabase.from('student_profiles').select('*').eq('id', userId).single()
      setProfile(data)
    }
  }

  async function loadProgrammes() {
    if (role === 'coach') {
      const { data } = await supabase.from('programmes').select('*').eq('coach_id', userId).order('created_at', { ascending: false }).limit(3)
      setProgrammes(data || [])
    } else {
      const { data: prof } = await supabase.from('profiles').select('email').eq('id', userId).single()
      if (prof) {
        const { data } = await supabase.from('programmes').select('*').eq('student_email', prof.email).limit(3)
        setProgrammes(data || [])
      }
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const displayName = profile?.name || (role === 'coach' ? 'Coach' : 'Athlete')
  const firstName = displayName.split(' ')[0]

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>

      {/* Header */}
      <div style={{ padding: '56px 20px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: '500', marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{greeting()}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{firstName} 👋</div>
          </div>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #1D9E75, #0a5c43)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '700', color: 'white',
            border: '2px solid #1D9E75'
          }}>
            {firstName[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: '0 20px 20px 20px' }}>
        <span style={{
          padding: '6px 14px',
          backgroundColor: role === 'coach' ? 'rgba(29,158,117,0.15)' : 'rgba(99,102,241,0.15)',
          color: role === 'coach' ? '#1D9E75' : '#818cf8',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          border: `1px solid ${role === 'coach' ? 'rgba(29,158,117,0.3)' : 'rgba(99,102,241,0.3)'}`,
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          {role === 'coach' ? '🎯 Coach' : '⚡ Athlete'}
        </span>
      </div>

      {/* Quick action cards */}
      <div style={{ padding: '0 20px 24px 20px' }}>
        <div style={{ fontSize: '12px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { icon: '💬', label: 'Messages', color: '#1D9E75', bg: 'rgba(29,158,117,0.1)', tab: 'home' },
            { icon: '🏋️', label: role === 'coach' ? 'Programmes' : 'My Training', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', tab: 'train' },
            { icon: '🗺️', label: 'Discover', color: '#818cf8', bg: 'rgba(129,140,248,0.1)', tab: 'discover' },
            { icon: '🎮', label: 'Events', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', tab: 'play' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => onNavigate(item.tab)}
              style={{
                backgroundColor: item.bg,
                border: `1px solid ${item.color}22`,
                borderRadius: '16px',
                padding: '18px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: item.color }}>{item.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent programmes */}
      <div style={{ padding: '0 20px 24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {role === 'coach' ? 'Recent Programmes' : 'My Training'}
          </div>
          <button onClick={() => onNavigate('train')} style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>See all →</button>
        </div>

        {programmes.length === 0 ? (
          <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '28px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '14px', color: '#555' }}>
              {role === 'coach' ? 'No programmes yet' : 'No training assigned yet'}
            </div>
          </div>
        ) : (
          programmes.map((prog, i) => (
            <div key={i} style={{
              backgroundColor: '#111',
              borderRadius: '16px',
              padding: '16px 18px',
              marginBottom: '10px',
              border: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>{prog.name}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>
                  {role === 'coach' ? `👤 ${prog.student_email}` : `📅 Due ${prog.due_date || 'No date'}`}
                </div>
              </div>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: 'rgba(29,158,117,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px'
              }}>
                →
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats row */}
      <div style={{ padding: '0 20px 24px 20px' }}>
        <div style={{ fontSize: '12px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Your Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'Programmes', value: programmes.length, icon: '📋' },
            { label: 'This Week', value: '0', icon: '🔥' },
            { label: 'Streak', value: '0d', icon: '⚡' },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: '#111', borderRadius: '14px', padding: '16px 12px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{stat.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '0 20px 32px 20px' }}>
        <button
          onClick={onSignOut}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: 'transparent',
            border: '1px solid #222',
            borderRadius: '12px',
            color: '#555',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

export default HomeTab