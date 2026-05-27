import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

function MessagesPage({ userId, role, onBack, embedded }) {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [pinnedConvs, setPinnedConvs] = useState([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [blockedUsers, setBlockedUsers] = useState([])
  const [showOptions, setShowOptions] = useState(false)
  const messagesEndRef = useRef(null)
  const subscriptionRef = useRef(null)

  useEffect(() => {
    loadConversations()
    loadPinnedConvs()
    loadBlockedUsers()
    return () => { if (subscriptionRef.current) subscriptionRef.current.unsubscribe() }
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
      subscribeToMessages(selectedConversation)
      markAsRead(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadPinnedConvs() {
    const { data } = await supabase
      .from('pinned_conversations')
      .select('*')
      .eq('user_id', userId)
    setPinnedConvs(data || [])
  }

  async function loadBlockedUsers() {
    const { data } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', userId)
    setBlockedUsers((data || []).map(b => b.blocked_id))
  }

  async function loadConversations() {
    setLoading(true)
    if (role === 'coach') {
      const { data } = await supabase
        .from('coach_students')
        .select('*')
        .eq('coach_id', userId)
        .eq('status', 'accepted')

      const enriched = await Promise.all((data || []).map(async (row) => {
        const { data: sp } = await supabase.from('student_profiles').select('name').eq('id', row.student_id).single()
        // Count unread messages
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', userId)
          .eq('student_id', row.student_id)
          .eq('read_by_coach', false)
          .neq('sender_id', userId)
        return {
          otherId: row.student_id,
          otherEmail: row.student_email,
          otherName: sp?.name || row.student_email?.split('@')[0] || 'Student',
          coachId: userId,
          studentId: row.student_id,
          unreadCount: count || 0,
        }
      }))
      setConversations(enriched)
    } else {
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single()
      if (!profile) { setLoading(false); return }

      const { data } = await supabase
        .from('coach_students')
        .select('*')
        .eq('student_email', profile.email)
        .eq('status', 'accepted')

      const enriched = await Promise.all((data || []).map(async (row) => {
        const { data: cp } = await supabase.from('coach_profiles').select('name').eq('id', row.coach_id).single()
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', row.coach_id)
          .eq('student_id', userId)
          .eq('read_by_student', false)
          .neq('sender_id', userId)
        return {
          otherId: row.coach_id,
          otherName: cp?.name || 'Your Coach',
          coachId: row.coach_id,
          studentId: userId,
          unreadCount: count || 0,
        }
      }))
      setConversations(enriched)
    }
    setLoading(false)
  }

  async function markAsRead(conversation) {
    if (role === 'coach') {
      await supabase
        .from('messages')
        .update({ read_by_coach: true })
        .eq('coach_id', conversation.coachId)
        .eq('student_id', conversation.studentId)
        .neq('sender_id', userId)
    } else {
      await supabase
        .from('messages')
        .update({ read_by_student: true })
        .eq('coach_id', conversation.coachId)
        .eq('student_id', conversation.studentId)
        .neq('sender_id', userId)
    }
    // Update unread count locally
    setConversations(prev => prev.map(c =>
      c.coachId === conversation.coachId && c.studentId === conversation.studentId
        ? { ...c, unreadCount: 0 }
        : c
    ))
  }

  async function loadMessages(conversation) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('coach_id', conversation.coachId)
      .eq('student_id', conversation.studentId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  function subscribeToMessages(conversation) {
    if (subscriptionRef.current) subscriptionRef.current.unsubscribe()
    subscriptionRef.current = supabase.channel('messages-channel')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `coach_id=eq.${conversation.coachId}`
      }, (payload) => {
        if (payload.new.student_id === conversation.studentId) {
          setMessages(prev => [...prev, payload.new])
        }
      }).subscribe()
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConversation) return
    setSending(true)
    const { error } = await supabase.from('messages').insert([{
      coach_id: selectedConversation.coachId,
      student_id: selectedConversation.studentId,
      sender_id: userId,
      content: newMessage.trim(),
      read_by_coach: role === 'coach',
      read_by_student: role === 'student',
    }])
    if (error) alert('Error: ' + error.message)
    else setNewMessage('')
    setSending(false)
  }

  async function togglePin(conversation) {
    const isPinned = pinnedConvs.some(p =>
      p.coach_id === conversation.coachId && p.student_id === conversation.studentId
    )
    if (isPinned) {
      await supabase
        .from('pinned_conversations')
        .delete()
        .eq('user_id', userId)
        .eq('coach_id', conversation.coachId)
        .eq('student_id', conversation.studentId)
    } else {
      await supabase.from('pinned_conversations').insert([{
        user_id: userId,
        coach_id: conversation.coachId,
        student_id: conversation.studentId,
      }])
    }
    loadPinnedConvs()
  }

  async function blockUser(otherId) {
    await supabase.from('blocks').insert([{
      blocker_id: userId,
      blocked_id: otherId,
    }])
    setBlockedUsers([...blockedUsers, otherId])
    setShowOptions(false)
    setSelectedConversation(null)
    alert('User blocked. You will no longer see their messages.')
  }

  async function submitReport() {
    if (!reportReason.trim()) { alert('Please enter a reason'); return }
    await supabase.from('reports').insert([{
      reporter_id: userId,
      reported_id: selectedConversation.otherId,
      reason: reportReason,
    }])
    setShowReportModal(false)
    setReportReason('')
    alert('Report submitted. Thank you for keeping CoachFlow safe.')
  }

  function isPinned(conversation) {
    return pinnedConvs.some(p =>
      p.coach_id === conversation.coachId && p.student_id === conversation.studentId
    )
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(ts) {
    const date = new Date(ts)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
  }

  function groupMessagesByDate(msgs) {
    const groups = []
    let currentDate = null
    let currentGroup = []
    msgs.forEach(msg => {
      const msgDate = new Date(msg.created_at).toDateString()
      if (msgDate !== currentDate) {
        if (currentGroup.length > 0) groups.push({ date: currentDate, messages: currentGroup })
        currentDate = msgDate
        currentGroup = [msg]
      } else {
        currentGroup.push(msg)
      }
    })
    if (currentGroup.length > 0) groups.push({ date: currentDate, messages: currentGroup })
    return groups
  }

  // Sort conversations: pinned first, then by unread
  const sortedConversations = [...conversations]
    .filter(c => !blockedUsers.includes(c.otherId))
    .sort((a, b) => {
      const aPinned = isPinned(a) ? 1 : 0
      const bPinned = isPinned(b) ? 1 : 0
      if (bPinned !== aPinned) return bPinned - aPinned
      return b.unreadCount - a.unreadCount
    })

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  // ── Chat view ──────────────────────────────────────────────────────────────
  if (selectedConversation) {
    const isBlocked = blockedUsers.includes(selectedConversation.otherId)

    return (
      <div style={{ backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', height: embedded ? 'calc(100vh - 140px)' : '100vh', color: 'white' }}>

        {/* Report modal */}
        {showReportModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '360px', border: '1px solid #222' }}>
              <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '6px' }}>🚩 Report user</div>
              <div style={{ fontSize: '13px', color: '#555', marginBottom: '16px' }}>Tell us what's wrong and we'll review it.</div>
              <textarea
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                placeholder="Describe the issue..."
                style={{ width: '100%', padding: '12px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '14px', minHeight: '100px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button onClick={submitReport} style={{ flex: 1, padding: '12px', backgroundColor: '#f43f5e', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Submit report</button>
                <button onClick={() => setShowReportModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', color: '#555', border: '1px solid #222', borderRadius: '12px', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Chat header */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#111' }}>
          <button onClick={() => { setSelectedConversation(null); setShowOptions(false) }} style={{ background: 'none', border: 'none', color: '#1D9E75', fontSize: '20px', cursor: 'pointer', padding: '0', lineHeight: 1 }}>←</button>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: 'white', fontWeight: '700' }}>
            {selectedConversation.otherName[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '700' }}>{selectedConversation.otherName}</div>
            <div style={{ fontSize: '11px', color: '#1D9E75' }}>● Active</div>
          </div>
          {/* Options button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              style={{ background: 'none', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}
            >
              ⋯
            </button>
            {showOptions && (
              <div style={{ position: 'absolute', right: 0, top: '36px', backgroundColor: '#1a1a1a', border: '1px solid #222', borderRadius: '14px', padding: '8px', minWidth: '180px', zIndex: 100 }}>
                <button
                  onClick={() => { togglePin(selectedConversation); setShowOptions(false) }}
                  style={{ display: 'block', width: '100%', padding: '10px 14px', backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '14px', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}
                >
                  {isPinned(selectedConversation) ? '📌 Unpin conversation' : '📌 Pin conversation'}
                </button>
                <button
                  onClick={() => { setShowReportModal(true); setShowOptions(false) }}
                  style={{ display: 'block', width: '100%', padding: '10px 14px', backgroundColor: 'transparent', border: 'none', color: '#f59e0b', fontSize: '14px', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}
                >
                  🚩 Report user
                </button>
                <button
                  onClick={() => blockUser(selectedConversation.otherId)}
                  style={{ display: 'block', width: '100%', padding: '10px 14px', backgroundColor: 'transparent', border: 'none', color: '#f43f5e', fontSize: '14px', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}
                >
                  🚫 Block user
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#0a0a0a' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#444', fontSize: '14px', marginTop: '40px' }}>No messages yet — say hello! 👋</div>
          ) : (
            groupMessagesByDate(messages).map((group, gi) => (
              <div key={gi}>
                <div style={{ textAlign: 'center', margin: '12px 0', fontSize: '11px', color: '#444' }}>
                  <span style={{ backgroundColor: '#111', padding: '3px 12px', borderRadius: '20px', border: '1px solid #1a1a1a' }}>{formatDate(group.messages[0].created_at)}</span>
                </div>
                {group.messages.map((msg, mi) => {
                  const isMe = msg.sender_id === userId
                  return (
                    <div key={mi} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '6px' }}>
                      <div style={{
                        maxWidth: '72%', padding: '10px 14px',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        backgroundColor: isMe ? '#1D9E75' : '#111',
                        color: 'white', fontSize: '14px', lineHeight: '1.5',
                        border: isMe ? 'none' : '1px solid #1a1a1a',
                      }}>
                        <div>{msg.content}</div>
                        <div style={{ fontSize: '10px', marginTop: '4px', color: isMe ? 'rgba(255,255,255,0.6)' : '#444', textAlign: 'right' }}>
                          {formatTime(msg.created_at)}
                          {isMe && <span style={{ marginLeft: '4px' }}>{msg.read_by_coach && msg.read_by_student ? ' ✓✓' : ' ✓'}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {isBlocked ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#555', fontSize: '13px', borderTop: '1px solid #1a1a1a', backgroundColor: '#111' }}>
            You have blocked this user
          </div>
        ) : (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1a1a1a', backgroundColor: '#111', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #222', borderRadius: '22px', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5', maxHeight: '100px', overflowY: 'auto', backgroundColor: '#0a0a0a', color: 'white' }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: newMessage.trim() ? '#1D9E75' : '#222', border: 'none', cursor: newMessage.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Conversation list ──────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#0a0a0a', color: 'white', minHeight: embedded ? 'auto' : '100vh' }}>
      {/* Unread banner */}
      {totalUnread > 0 && (
        <div style={{ margin: '12px 20px', padding: '12px 16px', backgroundColor: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '12px', fontSize: '13px', color: '#1D9E75', fontWeight: '600' }}>
          📬 {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>Loading...</div>
      ) : sortedConversations.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>No conversations yet</div>
          <div style={{ fontSize: '13px', color: '#555' }}>
            {role === 'coach' ? 'Add students to start messaging' : 'Accept a coach invite to start messaging'}
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 0 8px 0' }}>
          {sortedConversations.map((conv, i) => {
            const pinned = isPinned(conv)
            return (
              <div
                key={i}
                onClick={() => setSelectedConversation(conv)}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid #111', backgroundColor: '#0a0a0a', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#111'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0a0a0a'}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'white', fontWeight: '700' }}>
                    {(conv.otherName || '?')[0].toUpperCase()}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: 'white', border: '2px solid #0a0a0a' }}>
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </div>
                  )}
                </div>

                {/* Name + email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <div style={{ fontSize: '15px', fontWeight: conv.unreadCount > 0 ? '700' : '600' }}>{conv.otherName}</div>
                    {pinned && <span style={{ fontSize: '11px' }}>📌</span>}
                  </div>
                  {conv.otherEmail && <div style={{ fontSize: '12px', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.otherEmail}</div>}
                </div>

                {/* Unread dot or chevron */}
                {conv.unreadCount > 0 ? (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1D9E75', flexShrink: 0 }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MessagesPage