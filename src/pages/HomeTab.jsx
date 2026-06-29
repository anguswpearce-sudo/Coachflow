import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import MessagesPage from './MessagesPage'

function HomeTab({ userId, role, onSignOut, onNavigate, onOpenProgramme, onShowNotifications, unreadNotifications }) {
  const [profile, setProfile] = useState(null)
  const [programmes, setProgrammes] = useState([])
  const [feed, setFeed] = useState([])
  const [showMessages, setShowMessages] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showWeekBreakdown, setShowWeekBreakdown] = useState(false)
  const [showStreakHistory, setShowStreakHistory] = useState(false)
  const [weekSessions, setWeekSessions] = useState([])
  const [streakDays, setStreakDays] = useState([])

  useEffect(() => {
    loadProfile()
    loadProgrammes()
    loadFeed()
    if (role === 'student') loadWeekStats()
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

  async function loadFeed() {
    const items = []

    if (role === 'student') {
      const { data: prof } = await supabase.from('profiles').select('email').eq('id', userId).single()
      if (prof) {
        const { data: progs } = await supabase.from('programmes').select('*').eq('student_email', prof.email).order('created_at', { ascending: false }).limit(5)
        ;(progs || []).forEach(p => {
          items.push({ type: 'programme', text: `New programme: ${p.name}`, sub: 'Assigned by your coach', time: p.created_at, emoji: '📋', color: 'rgba(245,158,11,0.15)' })
        })
      }
      const { data: subs } = await supabase.from('submissions').select('*').eq('student_id', userId).order('created_at', { ascending: false }).limit(5)
      ;(subs || []).forEach(s => {
        items.push({ type: 'submission', text: 'Session submitted', sub: 'Awaiting coach review', time: s.created_at, emoji: '✅', color: 'rgba(29,158,117,0.15)' })
      })
      const { data: msgs } = await supabase.from('messages').select('*').eq('student_id', userId).neq('sender_id', userId).order('created_at', { ascending: false }).limit(5)
      ;(msgs || []).forEach(m => {
        items.push({ type: 'message', text: 'New message from coach', sub: m.content.length > 40 ? m.content.substring(0, 40) + '...' : m.content, time: m.created_at, emoji: '💬', color: 'rgba(129,140,248,0.15)' })
      })
      setUnreadCount((msgs || []).length)
    } else {
      const progIds = (await supabase.from('programmes').select('id').eq('coach_id', userId)).data?.map(p => p.id) || []
      if (progIds.length > 0) {
        const { data: subs } = await supabase.from('submissions').select('*, programmes(name)').in('programme_id', progIds).order('created_at', { ascending: false }).limit(5)
        ;(subs || []).forEach(s => {
          items.push({ type: 'submission', text: 'Session submitted', sub: s.programmes?.name || 'Programme', time: s.created_at, emoji: '📥', color: 'rgba(29,158,117,0.15)' })
        })
      }
      const { data: msgs } = await supabase.from('messages').select('*').eq('coach_id', userId).neq('sender_id', userId).order('created_at', { ascending: false }).limit(5)
      ;(msgs || []).forEach(m => {
        items.push({ type: 'message', text: 'New message from student', sub: m.content.length > 40 ? m.content.substring(0, 40) + '...' : m.content, time: m.created_at, emoji: '💬', color: 'rgba(129,140,248,0.15)' })
      })
      setUnreadCount((msgs || []).length)
    }

    items.sort((a, b) => new Date(b.time) - new Date(a.time))
    setFeed(items.slice(0, 8))
  }

  async function loadWeekStats() {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const { data: subs } = await supabase
      .from('submissions')
      .select('*, programmes(name)')
      .eq('student_id', userId)
      .gte('created_at', startOfWeek.toISOString())
      .order('created_at', { ascending: false })
    setWeekSessions(subs || [])

    const { data: allSubs } = await supabase
      .from('submissions')
      .select('created_at')
      .eq('student_id', userId)
      .order('created_at', { ascending: false })

    const submittedDates = new Set((allSubs || []).map(s => new Date(s.created_at).toDateString()))
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({ date: d, active: submittedDates.has(d.toDateString()) })
    }
    setStreakDays(days)
  }

  function timeAgo(timestamp) {
    const diff = Math.floor((new Date() - new Date(timestamp)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return new Date(timestamp).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const displayName = profile?.name || (role === 'coach' ? 'Coach' : 'Athlete')
  const firstName = displayName.split(' ')[0]

  if (showMessages) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
        <div style={{ padding: '56px 20px 16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setShowMessages(false)} style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
          <div style={{ fontSize: '18px', fontWeight: '800' }}>Messages</div>
        </div>
        <MessagesPage userId={userId} role={role} onBack={() => setShowMessages(false)} embedded={true} />
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>

      {/* Header */}
      <div style={{ padding: '56px 20px 16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#555', fontWeight: '600', marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{greeting()}</div>
            <div style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{firstName} 👋</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onShowNotifications && (
              <button
                onClick={onShowNotifications}
                style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#111', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadNotifications > 0 && (
                  <div style={{ position: 'absolute', top: '-3px', right: '-3px', minWidth: '15px', height: '15px', borderRadius: '8px', backgroundColor: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '800', color: 'white', border: '2px solid #0a0a0a', padding: '0 2px' }}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </div>
                )}
              </button>
            )}

            <button
              onClick={() => setShowMessages(true)}
              style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#111', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {unreadCount > 0 && (
                <div style={{ position: 'absolute', top: '-3px', right: '-3px', minWidth: '15px', height: '15px', borderRadius: '8px', backgroundColor: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '800', color: 'white', border: '2px solid #0a0a0a', padding: '0 2px' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: '0 20px 20px 20px' }}>
        <span style={{
          padding: '6px 14px',
          backgroundColor: role === 'coach' ? 'rgba(29,158,117,0.15)' : 'rgba(99,102,241,0.15)',
          color: role === 'coach' ? '#1D9E75' : '#818cf8',
          borderRadius: '20px', fontSize: '12px', fontWeight: '600',
          border: `1px solid ${role === 'coach' ? 'rgba(29,158,117,0.3)' : 'rgba(99,102,241,0.3)'}`,
          letterSpacing: '0.5px', textTransform: 'uppercase'
        }}>
          {role === 'coach' ? '🎯 Coach' : '⚡ Athlete'}
        </span>
      </div>

      {/* Activity feed */}
      <div style={{ padding: '0 20px 24px 20px' }}>
        <div style={{ fontSize: '12px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Recent Activity</div>
        {feed.length === 0 ? (
          <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '28px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
            <div style={{ fontSize: '14px', color: '#555' }}>No activity yet — get started!</div>
          </div>
        ) : (
          feed.map((item, i) => (
            <div
              key={i}
              onClick={
                item.type === 'message' ? () => setShowMessages(true) :
                item.type === 'programme' ? () => onNavigate('train') :
                undefined
              }
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', backgroundColor: '#111',
                borderRadius: '14px', marginBottom: '8px', border: '1px solid #1a1a1a',
                cursor: item.type === 'message' || item.type === 'programme' ? 'pointer' : 'default',
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                {item.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '2px' }}>{item.text}</div>
                <div style={{ fontSize: '11px', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sub}</div>
              </div>
              <div style={{ fontSize: '11px', color: '#444', flexShrink: 0 }}>{timeAgo(item.time)}</div>
            </div>
          ))
        )}
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
            <div style={{ fontSize: '14px', color: '#555' }}>{role === 'coach' ? 'No programmes yet' : 'No training assigned yet'}</div>
          </div>
        ) : (
          programmes.map((prog, i) => (
            <div
              key={i}
              onClick={() => onOpenProgramme(prog)}
              style={{
                backgroundColor: '#111', borderRadius: '16px', padding: '16px 18px',
                marginBottom: '10px', border: '1px solid #1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#1D9E75'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>{prog.name}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>
                  {role === 'coach' ? `👤 ${prog.student_email}` : `📅 Due ${prog.due_date || 'No date'}`}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div style={{ padding: '0 20px 32px 20px' }}>
        <div style={{ fontSize: '12px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Your Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'Programmes', value: programmes.length, icon: '📋', onClick: () => onNavigate('train') },
            { label: 'This Week', value: weekSessions.length, icon: '🔥', onClick: role === 'student' ? () => setShowWeekBreakdown(true) : null },
            { label: 'Streak', value: `${streakDays.filter(d => d.active).length}d`, icon: '⚡', onClick: role === 'student' ? () => setShowStreakHistory(true) : null },
          ].map((stat, i) => (
            <div
              key={i}
              onClick={stat.onClick || undefined}
              style={{
                backgroundColor: '#111', borderRadius: '14px', padding: '16px 12px',
                textAlign: 'center', border: '1px solid #1a1a1a',
                cursor: stat.onClick ? 'pointer' : 'default',
                transition: 'border-color 0.15s'
              }}
              onMouseEnter={e => { if (stat.onClick) e.currentTarget.style.borderColor = '#1D9E75' }}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}
            >
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{stat.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Week breakdown modal */}
      {showWeekBreakdown && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#111', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px 20px', width: '100%', maxWidth: '430px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800' }}>This Week</div>
              <button onClick={() => setShowWeekBreakdown(false)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            {weekSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#555' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔥</div>
                <div style={{ fontSize: '14px' }}>No sessions submitted this week yet</div>
              </div>
            ) : (
              weekSessions.map((sub, i) => (
                <div key={i} style={{ backgroundColor: '#0a0a0a', borderRadius: '12px', padding: '14px 16px', marginBottom: '8px', border: '1px solid #1a1a1a' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '3px' }}>{sub.programmes?.name || 'Session'}</div>
                  <div style={{ fontSize: '12px', color: '#555' }}>
                    {new Date(sub.created_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}{sub.completed_activities?.length || 0} activities completed
                  </div>
                  {sub.notes && <div style={{ fontSize: '12px', color: '#444', marginTop: '6px', fontStyle: 'italic' }}>"{sub.notes}"</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Streak history modal */}
      {showStreakHistory && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#111', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px 20px', width: '100%', maxWidth: '430px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800' }}>Streak History</div>
              <button onClick={() => setShowStreakHistory(false)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize: '12px', color: '#555', marginBottom: '14px' }}>Last 30 days</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} style={{ fontSize: '10px', color: '#444', textAlign: 'center', fontWeight: '600' }}>{d}</div>
              ))}
              {streakDays.map((day, i) => (
                <div
                  key={i}
                  title={day.date.toLocaleDateString('en-AU')}
                  style={{
                    height: '32px', borderRadius: '6px',
                    backgroundColor: day.active ? '#1D9E75' : '#1a1a1a',
                    border: `1px solid ${day.active ? 'rgba(29,158,117,0.5)' : '#222'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: day.active ? 'white' : '#333', fontWeight: '600'
                  }}
                >
                  {day.date.getDate()}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#1D9E75' }} /> Session submitted
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#1a1a1a', border: '1px solid #222' }} /> No session
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default HomeTab