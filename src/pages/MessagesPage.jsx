import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

function MessagesPage({ userId, role, onBack }) {
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
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
      subscribeToMessages(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadConversations() {
    setLoading(true)

    if (role === 'coach') {
      // Coach sees all students they have programmes with
      const { data: programmes } = await supabase
        .from('programmes')
        .select('student_email')
        .eq('coach_id', userId)

      if (!programmes || programmes.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      const emails = [...new Set(programmes.map(p => p.student_email))]

      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', emails)

      const convs = (studentProfiles || []).map(s => ({
        otherId: s.id,
        otherEmail: s.email,
        otherName: s.email.split('@')[0],
        coachId: userId,
        studentId: s.id,
      }))
      setConversations(convs)

    } else {
      // Student sees all coaches they have programmes with
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()

      if (!profile) {
        setLoading(false)
        return
      }

      const { data: programmes } = await supabase
        .from('programmes')
        .select('coach_id')
        .eq('student_email', profile.email)

      if (!programmes || programmes.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      const coachIds = [...new Set(programmes.map(p => p.coach_id))]

      const { data: coachProfiles } = await supabase
        .from('coach_profiles')
        .select('id, name')
        .in('id', coachIds)

      const convs = (coachProfiles || []).map(c => ({
        otherId: c.id,
        otherName: c.name || 'Your Coach',
        coachId: c.id,
        studentId: userId,
      }))
      setConversations(convs)
    }

    setLoading(false)
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
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    subscriptionRef.current = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `coach_id=eq.${conversation.coachId}`,
        },
        (payload) => {
          if (payload.new.student_id === conversation.studentId) {
            setMessages(prev => [...prev, payload.new])
          }
        }
      )
      .subscribe()
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConversation) return
    setSending(true)

    const { error } = await supabase
      .from('messages')
      .insert([{
        coach_id: selectedConversation.coachId,
        student_id: selectedConversation.studentId,
        sender_id: userId,
        content: newMessage.trim(),
      }])

    if (error) {
      alert('Error sending message: ' + error.message)
    } else {
      setNewMessage('')
    }
    setSending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
  }

  // Group messages by date
  function groupMessagesByDate(msgs) {
    const groups = []
    let currentDate = null
    let currentGroup = []

    msgs.forEach(msg => {
      const msgDate = new Date(msg.created_at).toDateString()
      if (msgDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup })
        }
        currentDate = msgDate
        currentGroup = [msg]
      } else {
        currentGroup.push(msg)
      }
    })
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup })
    }
    return groups
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Messages</h1>
          <p style={{ fontSize: '13px', color: '#888', margin: '2px 0 0 0' }}>
            {role === 'coach' ? 'Chat with your students' : 'Chat with your coach'}
          </p>
        </div>
      </div>

      {/* Chat layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: '0',
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #eee',
        overflow: 'hidden',
        height: '600px'
      }}>

        {/* Left sidebar — conversation list */}
        <div style={{
          borderRight: '1px solid #eee',
          overflowY: 'auto',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Conversations
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
              {role === 'coach'
                ? 'No students yet.\nAssign a programme first.'
                : 'No coaches yet.\nWait for a programme to be assigned.'}
            </div>
          ) : (
            conversations.map((conv, i) => (
              <div
                key={i}
                onClick={() => setSelectedConversation(conv)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  backgroundColor: selectedConversation?.otherId === conv.otherId ? '#E1F5EE' : 'white',
                  transition: 'background 0.1s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', color: 'white', fontWeight: '600', flexShrink: 0
                  }}>
                    {conv.otherName ? conv.otherName[0].toUpperCase() : '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                      {conv.otherName}
                    </div>
                    {conv.otherEmail && (
                      <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                        {conv.otherEmail}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right side — message thread */}
        {!selectedConversation ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', color: '#bbb', gap: '12px'
          }}>
            <div style={{ fontSize: '40px' }}>💬</div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#999' }}>Select a conversation</div>
            <div style={{ fontSize: '13px', color: '#bbb' }}>Choose someone from the left to start chatting</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Chat header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'white'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', color: 'white', fontWeight: '600'
              }}>
                {selectedConversation.otherName[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{selectedConversation.otherName}</div>
                <div style={{ fontSize: '12px', color: '#1D9E75' }}>● Online</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              backgroundColor: '#F7F7F5',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {messages.length === 0 ? (
                <div style={{
                  textAlign: 'center', color: '#bbb', fontSize: '14px',
                  marginTop: '40px'
                }}>
                  No messages yet — say hello! 👋
                </div>
              ) : (
                groupMessagesByDate(messages).map((group, gi) => (
                  <div key={gi}>
                    {/* Date divider */}
                    <div style={{
                      textAlign: 'center',
                      margin: '16px 0 12px 0',
                      fontSize: '12px',
                      color: '#aaa'
                    }}>
                      <span style={{
                        backgroundColor: '#e8e8e8',
                        padding: '3px 12px',
                        borderRadius: '20px'
                      }}>
                        {formatDate(group.messages[0].created_at)}
                      </span>
                    </div>

                    {group.messages.map((msg, mi) => {
                      const isMe = msg.sender_id === userId
                      return (
                        <div
                          key={mi}
                          style={{
                            display: 'flex',
                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                            marginBottom: '6px'
                          }}
                        >
                          <div style={{
                            maxWidth: '65%',
                            padding: '10px 14px',
                            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            backgroundColor: isMe ? '#1D9E75' : 'white',
                            color: isMe ? 'white' : '#1a1a1a',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                            border: isMe ? 'none' : '1px solid #eee'
                          }}>
                            <div>{msg.content}</div>
                            <div style={{
                              fontSize: '11px',
                              marginTop: '4px',
                              color: isMe ? 'rgba(255,255,255,0.7)' : '#bbb',
                              textAlign: 'right'
                            }}>
                              {formatTime(msg.created_at)}
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

            {/* Message input */}
            <div style={{
              padding: '14px 16px',
              borderTop: '1px solid #eee',
              backgroundColor: 'white',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-end'
            }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid #eee',
                  borderRadius: '22px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  maxHeight: '100px',
                  overflowY: 'auto'
                }}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: newMessage.trim() ? '#1D9E75' : '#eee',
                  border: 'none',
                  cursor: newMessage.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0,
                  transition: 'background 0.15s'
                }}
              >
                ➤
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessagesPage