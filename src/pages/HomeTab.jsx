import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import MessagesPage from './MessagesPage'

function HomeTab({ userId, role, onSignOut, onNavigate, onOpenProgramme }) {
  const [profile, setProfile] = useState(null)
  const [programmes, setProgrammes] = useState([])
  const [feed, setFeed] = useState([])
  const [showMessages, setShowMessages] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadProfile()
    loadProgrammes()
    loadFeed()
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
      // New programmes assigned
      const { data: prof } = await supabase.from('profiles').select('email').eq('id', userId).single()
      if (prof) {
        const { data: progs } = await supabase.from('programmes').select('*').eq('student_email', prof.email).order('created_at', { ascending: false }).limit(5)
        ;(progs || []).forEach(p => {
          items.push({ type: 'programme', text: `New programme: ${p.name}`, sub: 'Assigned by your coach', time: p.created_at, emoji: '📋', color: 'rgba(245,158,11,0.15)', emojiColor: '#f59e0b' })
        })
      }

      // Submissions
      const { data: subs } = await supabase.from('submissions').select('*').eq('student_id', userId).order('created_at', { ascending: false }).limit(5)
      ;(subs || []).forEach(s => {
        items.push({ type: 'submission', text: 'Session submitted', sub: 'Awaiting coach review', time: s.created_at, emoji: '✅', color: 'rgba(29,158,117,0.15)', emojiColor: '#1D9E75' })
      })

      // Messages received
      const { data: msgs } = await supabase.from('messages').select('*').eq('student_id', userId).neq('sender_id', userId).order('created_at', { ascending: false }).limit(5)
      ;(msgs || []).forEach(m => {
        items.push({ type: 'message', text: 'New message from coach', sub: m.content.length > 40 ? m.content.substring(0, 40) + '...' : m.content, time: m.created_at, emoji: '💬', color: 'rgba(129,140,248,0.15)', emojiColor: '#818cf8' })
      })
      setUnreadCount((msgs || []).length)

    } else {
      // Coach feed
      const { data: subs } = await supabase
        .from('submissions')
        .select('*, programmes(name, student_email)')
        .in('programme_id', (await supabase.from('programmes').select('id').eq('coach_id', userId)).data?.map(p => p.id) || [])
        .order('created_at', { ascending: false })
        .limit(5)
      ;(subs || []).forEach(s => {
        items.push({ type: 'submission', text: `Session submitted`, sub: s.programmes?.name || 'Programme', time: s.created_at, emoji: '📥', color: 'rgba(29,158,117,0.15)', emojiColor: '#1D9E75' })
      })

      // Messages received
      const { data: msgs } = await supabase.from('messages').select('*').eq('coach_id', userId).neq('sender_id', userId).order('created_at', { ascending: false }).limit(5)
      ;(msgs || []).forEach(m => {
        items.push({ type: 'message', text: 'New message from student', sub: m.content.length > 40 ? m.content.substring(0, 40) + '...' : m.content, time: m.created_at, emoji: '💬', color: 'rgba(129,140,248,0.15)', emojiColor: '#818cf8' })
      })
      setUnreadCount((msgs || []).length)
    }

    // Sort by time descending
    items.sort((a, b) => new Date(b.time) - new Date(a.time))
    setFeed(items.slice(0, 8))
  }

  function timeAgo(timestamp) {
    const now = new Date()
    const then = new Date(timestamp)
    const diff = Math.floor((now - then) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return then.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
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
      <div style={{ padding: '56px 20px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: '500', marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{greeting()}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{firstName} 👋</div>
          </div>

          {/* Messages button */}
          <button
            onClick={() => setShowMessages(true)}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: '#111',
              border: '1px solid #222',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', flexShrink: 0
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute', top: '-2px', right: '-2px',
                width: '16px', height: '16px', borderRadius: '50%',
                backgroundColor: '#f43f5e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: '800', color: 'white',
                border: '2px solid #0a0a0a'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </button>
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
              onClick={item.type === 'message' ? () => setShowMessages(true) : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px',
                backgroundColor: '#111',
                borderRadius: '14px',
                marginBottom: '8px',
                border: '1px solid #1a1a1a',
                cursor: item.type === 'message' ? 'pointer' : 'default',
              }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                backgroundColor: item.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0
              }}>
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
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: 'rgba(29,158,117,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', color: '#1D9E75', fontWeight: '700'
              }}>→</div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
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
        <button onClick={onSignOut} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: '1px solid #222', borderRadius: '12px', color: '#555', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}

export default HomeTab