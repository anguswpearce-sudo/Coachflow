import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function NotificationsPage({ userId, onBack, onMarkAllRead }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data || [])
    setLoading(false)
  }

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    setNotifications(notifications.map(n => ({ ...n, read: true })))
    onMarkAllRead()
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function timeAgo(ts) {
    const diff = Math.floor((new Date() - new Date(ts)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return new Date(ts).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  }

  const typeConfig = {
    message:      { icon: '💬', color: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.3)', label: 'Message' },
    submission:   { icon: '📥', color: 'rgba(29,158,117,0.15)',  border: 'rgba(29,158,117,0.3)',  label: 'Submission' },
    feedback:     { icon: '💭', color: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  label: 'Feedback' },
    invite:       { icon: '🤝', color: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.3)',  label: 'Invite' },
    event:        { icon: '🏃', color: 'rgba(244,63,94,0.15)',   border: 'rgba(244,63,94,0.3)',   label: 'Event' },
    challenge:    { icon: '🏆', color: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  label: 'Challenge' },
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>

      {/* Header */}
      <div style={{ padding: '56px 20px 16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
          <div style={{ fontSize: '18px', fontWeight: '800' }}>Notifications</div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ fontSize: '12px', color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
            Mark all read
          </button>
        )}
      </div>

      <div style={{ padding: '0 20px 40px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>All caught up!</div>
            <div style={{ fontSize: '13px', color: '#555' }}>No notifications yet</div>
          </div>
        ) : (
          <>
            {unreadCount > 0 && (
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                New · {unreadCount}
              </div>
            )}
            {notifications.map((notif, i) => {
              const config = typeConfig[notif.type] || typeConfig.message
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markRead(notif.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '14px 16px',
                    backgroundColor: notif.read ? '#0a0a0a' : '#111',
                    borderRadius: '16px',
                    marginBottom: '8px',
                    border: `1px solid ${notif.read ? '#1a1a1a' : config.border}`,
                    cursor: notif.read ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    backgroundColor: config.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', flexShrink: 0,
                  }}>
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: notif.read ? '400' : '600', color: notif.read ? '#aaa' : 'white', marginBottom: '3px' }}>
                      {notif.title}
                    </div>
                    {notif.body && (
                      <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {notif.body}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>{timeAgo(notif.created_at)}</div>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1D9E75', flexShrink: 0, marginTop: '4px' }} />
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage