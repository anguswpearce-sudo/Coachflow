import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

function MessagesPage({ userId, role, onBack, embedded }) {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const subscriptionRef = useRef(null)

  useEffect(() => {
    loadConversations()
    return () => { if (subscriptionRef.current) subscriptionRef.current.unsubscribe() }
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
      subscribeToMessages(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    setLoading(true)
    if (role === 'coach') {
      const { data } = await supabase.from('coach_students').select('*').eq('coach_id', userId).eq('status', 'accepted')
      const convs = (data || []).map(row => ({
        otherId: row.student_id,
        otherEmail: row.student_email,
        otherName: row.student_email.split('@')[0],
        coachId: userId,
        studentId: row.student_id,
      }))
      const enriched = await Promise.all(convs.map(async (conv) => {
        if (conv.otherId) {
          const { data: sp } = await supabase.from('student_profiles').select('name').eq('id', conv.otherId).single()
          if (sp?.name) return { ...conv, otherName: sp.name }
        }
        return conv
      }))
      setConversations(enriched)
    } else {
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single()
      if (!profile) { setLoading(false); return }
      const { data } = await supabase.from('coach_students').select('*').eq('student_email', profile.email).eq('status', 'accepted')
      const enriched = await Promise.all((data || []).map(async (row) => {
        const { data: cp } = await supabase.from('coach_profiles').select('name').eq('id', row.coach_id).single()
        return { otherId: row.coach_id, otherName: cp?.name || 'Your Coach', coachId: row.coach_id, studentId: userId }
      }))
      setConversations(enriched)
    }
    setLoading(false)
  }

  async function loadMessages(conversation) {
    const { data } = await supabase.from('messages').select('*').eq('coach_id', conversation.coachId).eq('student_id', conversation.studentId).order('created_at', { ascending: true })
    setMessages(data || [])
  }

  function subscribeToMessages(conversation) {
    if (subscriptionRef.current) subscriptionRef.current.unsubscribe()
    subscriptionRef.current = supabase.channel('messages-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `coach_id=eq.${conversation.coachId}` }, (payload) => {
        if (payload.new.student_id === conversation.studentId) {
          setMessages(prev => [...prev, payload.new])
        }
      }).subscribe()
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConversation) return
    setSending(true)
    const { error } = await supabase.from('messages').insert([{ coach_id: selectedConversation.coachId, student_id: selectedConversation.studentId, sender_id: userId, content: newMessage.trim() }])
    if (error) alert('Error: ' + error.message)
    else setNewMessage('')
    setSending(false)
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

  // Full screen chat view
  if (selectedConversation) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', height: embedded ? 'calc(100vh - 140px)' : '100vh', color: 'white' }}>

        {/* Chat header */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#111' }}>
          <button onClick={() => setSelectedConversation(null)} style={{ background: 'none', border: 'none', color: '#1D9E75', fontSize: '20px', cursor: 'pointer', padding: '0', lineHeight: 1 }}>←</button>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: 'white', fontWeight: '700' }}>
            {selectedConversation.otherName[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700' }}>{selectedConversation.otherName}</div>
            <div style={{ fontSize: '11px', color: '#1D9E75' }}>● Active</div>
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
                        userSelect: 'text', cursor: 'text'
                      }}>
                        <div>{msg.content}</div>
                        <div style={{ fontSize: '10px', marginTop: '4px', color: isMe ? 'rgba(255,255,255,0.6)' : '#444', textAlign: 'right' }}>{formatTime(msg.created_at)}</div>
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
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: newMessage.trim() ? '#1D9E75' : '#222',
              border: 'none', cursor: newMessage.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // Conversation list
  return (
    <div style={{ backgroundColor: '#0a0a0a', color: 'white', minHeight: embedded ? 'auto' : '100vh' }}>
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>Loading...</div>
      ) : conversations.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>No conversations yet</div>
          <div style={{ fontSize: '13px', color: '#555' }}>
            {role === 'coach' ? 'Add students to start messaging' : 'Accept a coach invite to start messaging'}
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 0 8px 0' }}>
          {conversations.map((conv, i) => (
            <div
              key={i}
              onClick={() => setSelectedConversation(conv)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 20px', cursor: 'pointer',
                borderBottom: '1px solid #111',
                backgroundColor: '#0a0a0a',
                transition: 'background 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#111'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0a0a0a'}
            >
              <div style={{
                width: '46px', height: '46px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #1D9E75, #0a5c43)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', color: 'white', fontWeight: '700', flexShrink: 0
              }}>
                {(conv.otherName || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '2px' }}>{conv.otherName}</div>
                {conv.otherEmail && <div style={{ fontSize: '12px', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.otherEmail}</div>}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MessagesPage