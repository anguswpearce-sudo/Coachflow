import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function PlayTab({ userId, role }) {
  const [activeSection, setActiveSection] = useState('events')
  const [events, setEvents] = useState([])
  const [challenges, setChallenges] = useState([])
  const [myEntries, setMyEntries] = useState([])
  const [myAttendance, setMyAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createType, setCreateType] = useState('event')
  const [profile, setProfile] = useState(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterSport, setFilterSport] = useState('')

  // Event form
  const [eventTitle, setEventTitle] = useState('')
  const [eventSport, setEventSport] = useState('')
  const [eventType, setEventType] = useState('pickup')
  const [eventLocation, setEventLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventMaxPlayers, setEventMaxPlayers] = useState('10')
  const [eventSkill, setEventSkill] = useState('all')
  const [eventPublic, setEventPublic] = useState(true)
  const [eventNotes, setEventNotes] = useState('')
  const [savingEvent, setSavingEvent] = useState(false)

  // Challenge form
  const [challengeTitle, setChallengeTitle] = useState('')
  const [challengeDesc, setChallengeDesc] = useState('')
  const [challengeMetric, setChallengeMetric] = useState('sessions')
  const [challengeEnd, setChallengeEnd] = useState('')
  const [challengePublic, setChallengePublic] = useState(true)
  const [savingChallenge, setSavingChallenge] = useState(false)

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  const sports = ['Football', 'Basketball', 'Rugby', 'Tennis', 'Cricket', 'Soccer', 'Volleyball', 'AFL', 'Netball', 'Swimming', 'Running', 'CrossFit', 'Gym', 'Cycling', 'Other']
  const skillLevels = ['all', 'beginner', 'intermediate', 'advanced']
  const eventTypes = [
    { id: 'pickup', label: '🏃 Pick-up game', desc: 'Casual game, anyone welcome' },
    { id: 'practice', label: '🎯 Practice', desc: 'Structured team practice' },
    { id: 'open_session', label: '⚡ Open session', desc: 'Training session, all sports welcome' },
  ]

  useEffect(() => {
    loadAll()
    loadProfile()
  }, [userId])

  async function loadProfile() {
    if (role === 'coach') {
      const { data } = await supabase.from('coach_profiles').select('name').eq('id', userId).single()
      setProfile(data)
    } else {
      const { data } = await supabase.from('student_profiles').select('name').eq('id', userId).single()
      setProfile(data)
    }
  }

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadEvents(), loadChallenges()])
    setLoading(false)
  }

  async function loadEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
    setEvents(data || [])

    const { data: att } = await supabase
      .from('event_attendees')
      .select('event_id')
      .eq('user_id', userId)
    setMyAttendance((att || []).map(a => a.event_id))
  }

  async function loadChallenges() {
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false })
    setChallenges(data || [])

    const { data: entries } = await supabase
      .from('challenge_entries')
      .select('challenge_id')
      .eq('user_id', userId)
    setMyEntries((entries || []).map(e => e.challenge_id))
  }

  async function loadLeaderboard(challengeId) {
    const { data } = await supabase
      .from('challenge_entries')
      .select('user_id, score')
      .eq('challenge_id', challengeId)
      .order('score', { ascending: false })
      .limit(10)

    const enriched = await Promise.all((data || []).map(async (entry, i) => {
      const { data: cp } = await supabase.from('coach_profiles').select('name').eq('id', entry.user_id).single()
      const { data: sp } = await supabase.from('student_profiles').select('name').eq('id', entry.user_id).single()
      return { ...entry, name: cp?.name || sp?.name || 'Unknown', rank: i + 1 }
    }))
    setLeaderboard(enriched)
  }

  async function joinEvent(eventId) {
    const { error } = await supabase.from('event_attendees').insert([{ event_id: eventId, user_id: userId }])
    if (error) { alert('Error joining: ' + error.message); return }
    setMyAttendance([...myAttendance, eventId])
  }

  async function leaveEvent(eventId) {
    await supabase.from('event_attendees').delete().eq('event_id', eventId).eq('user_id', userId)
    setMyAttendance(myAttendance.filter(id => id !== eventId))
  }

  async function joinChallenge(challengeId) {
    const { error } = await supabase.from('challenge_entries').insert([{ challenge_id: challengeId, user_id: userId, score: 0 }])
    if (error) { alert('Error joining: ' + error.message); return }
    setMyEntries([...myEntries, challengeId])
  }

  async function createEvent() {
    if (!eventTitle.trim() || !eventLocation.trim() || !eventDate || !eventTime) {
      alert('Please fill in title, location, date and time!')
      return
    }
    setSavingEvent(true)
    const eventDateTime = new Date(`${eventDate}T${eventTime}`).toISOString()
    const { error } = await supabase.from('events').insert([{
      created_by: userId,
      title: eventTitle.trim(),
      sport: eventSport,
      type: eventType,
      location: eventLocation.trim(),
      event_date: eventDateTime,
      max_players: parseInt(eventMaxPlayers) || 10,
      skill_level: eventSkill,
      is_public: eventPublic,
      notes: eventNotes.trim(),
    }])
    if (error) { alert('Error: ' + error.message); setSavingEvent(false); return }
    setShowCreate(false)
    resetEventForm()
    loadEvents()
    setSavingEvent(false)
  }

  async function createChallenge() {
    if (!challengeTitle.trim()) { alert('Please enter a challenge title!'); return }
    setSavingChallenge(true)
    const { error } = await supabase.from('challenges').insert([{
      created_by: userId,
      title: challengeTitle.trim(),
      description: challengeDesc.trim(),
      type: 'custom',
      metric: challengeMetric,
      starts_at: new Date().toISOString(),
      ends_at: challengeEnd ? new Date(challengeEnd).toISOString() : null,
      is_public: challengePublic,
    }])
    if (error) { alert('Error: ' + error.message); setSavingChallenge(false); return }
    setShowCreate(false)
    resetChallengeForm()
    loadChallenges()
    setSavingChallenge(false)
  }

  function resetEventForm() {
    setEventTitle(''); setEventSport(''); setEventType('pickup')
    setEventLocation(''); setEventDate(''); setEventTime('')
    setEventMaxPlayers('10'); setEventSkill('all'); setEventPublic(true); setEventNotes('')
  }

  function resetChallengeForm() {
    setChallengeTitle(''); setChallengeDesc(''); setChallengeMetric('sessions')
    setChallengeEnd(''); setChallengePublic(true)
  }

  function formatEventDate(ts) {
    const d = new Date(ts)
    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function timeUntil(ts) {
    const diff = new Date(ts) - new Date()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return `${days}d away`
    if (hours > 0) return `${hours}h away`
    return 'Soon'
  }

  const skillColor = { all: '#1D9E75', beginner: '#6366f1', intermediate: '#f59e0b', advanced: '#f43f5e' }
  const typeEmoji = { pickup: '🏃', practice: '🎯', open_session: '⚡' }
  const metricLabel = { sessions: 'Most sessions', activities: 'Most activities', streak: 'Longest streak' }

  // ── Filtering logic ───────────────────────────────────────────
  const allSports = [...new Set(events.map(e => e.sport).filter(Boolean))]

  const filteredEvents = events.filter(event => {
    const matchSearch = !searchQuery ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.sport || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = filterType === 'all' || event.type === filterType
    const matchSport = !filterSport || event.sport === filterSport
    return matchSearch && matchType && matchSport
  })

  // ── EVENT DETAIL ──────────────────────────────────────────────
  if (selectedEvent) {
    const isAttending = myAttendance.includes(selectedEvent.id)
    const isOwner = selectedEvent.created_by === userId

    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
        <div style={{ padding: '56px 20px 16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSelectedEvent(null)} style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
        </div>

        <div style={{ padding: '0 20px 40px 20px' }}>
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {typeEmoji[selectedEvent.type]} {selectedEvent.type.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{selectedEvent.title}</div>
                {selectedEvent.sport && <div style={{ fontSize: '13px', color: '#1D9E75', fontWeight: '600' }}>🏅 {selectedEvent.sport}</div>}
              </div>
              {!selectedEvent.is_public && <span style={{ fontSize: '11px', backgroundColor: '#1a1a1a', color: '#555', padding: '4px 10px', borderRadius: '20px', border: '1px solid #222' }}>🔒 Private</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#aaa' }}>
                <span style={{ fontSize: '16px' }}>📅</span> {formatEventDate(selectedEvent.event_date)}
                <span style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '600', backgroundColor: 'rgba(29,158,117,0.1)', padding: '2px 8px', borderRadius: '20px' }}>{timeUntil(selectedEvent.event_date)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#aaa' }}>
                <span style={{ fontSize: '16px' }}>📍</span> {selectedEvent.location}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#aaa' }}>
                <span style={{ fontSize: '16px' }}>👥</span> Up to {selectedEvent.max_players} players
                <span style={{ fontSize: '11px', color: skillColor[selectedEvent.skill_level] || '#555', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '20px', border: `1px solid ${skillColor[selectedEvent.skill_level] || '#333'}` }}>
                  {selectedEvent.skill_level === 'all' ? 'All levels' : selectedEvent.skill_level}
                </span>
              </div>
            </div>

            {selectedEvent.notes && (
              <div style={{ backgroundColor: '#0a0a0a', borderRadius: '12px', padding: '14px', fontSize: '14px', color: '#aaa', lineHeight: '1.6', marginBottom: '20px', border: '1px solid #1a1a1a' }}>
                {selectedEvent.notes}
              </div>
            )}

            {!isOwner && (
              isAttending ? (
                <div>
                  <div style={{ padding: '14px', backgroundColor: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '12px', textAlign: 'center', color: '#1D9E75', fontWeight: '600', fontSize: '14px', marginBottom: '10px' }}>
                    ✅ You're in!
                  </div>
                  <button onClick={() => leaveEvent(selectedEvent.id)} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: '1px solid #333', borderRadius: '12px', color: '#555', fontSize: '13px', cursor: 'pointer' }}>
                    Leave event
                  </button>
                </div>
              ) : (
                <button onClick={() => joinEvent(selectedEvent.id)} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                  Join {typeEmoji[selectedEvent.type]} {selectedEvent.title}
                </button>
              )
            )}
            {isOwner && (
              <div style={{ padding: '12px 16px', backgroundColor: '#1a1a1a', borderRadius: '12px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
                📌 You created this event
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── CHALLENGE DETAIL ──────────────────────────────────────────
  if (selectedChallenge) {
    const isJoined = myEntries.includes(selectedChallenge.id)
    const isOwner = selectedChallenge.created_by === userId
    const isActive = !selectedChallenge.ends_at || new Date(selectedChallenge.ends_at) > new Date()

    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
        <div style={{ padding: '56px 20px 16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { setSelectedChallenge(null); setLeaderboard([]) }} style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
        </div>

        <div style={{ padding: '0 20px 40px 20px' }}>
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>🏆 Challenge</div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>{selectedChallenge.title}</div>
            {selectedChallenge.description && <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.6', marginBottom: '16px' }}>{selectedChallenge.description}</p>}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '4px 12px', borderRadius: '20px', fontWeight: '600', border: '1px solid rgba(245,158,11,0.3)' }}>
                📊 {metricLabel[selectedChallenge.metric]}
              </span>
              {selectedChallenge.ends_at && (
                <span style={{ fontSize: '12px', backgroundColor: '#1a1a1a', color: '#555', padding: '4px 12px', borderRadius: '20px', fontWeight: '600' }}>
                  📅 Ends {new Date(selectedChallenge.ends_at).toLocaleDateString('en-AU')}
                </span>
              )}
              <span style={{ fontSize: '12px', backgroundColor: isActive ? 'rgba(29,158,117,0.1)' : '#1a1a1a', color: isActive ? '#1D9E75' : '#555', padding: '4px 12px', borderRadius: '20px', fontWeight: '600' }}>
                {isActive ? '🟢 Active' : '🔴 Ended'}
              </span>
            </div>

            {!isOwner && isActive && (
              isJoined ? (
                <div style={{ padding: '14px', backgroundColor: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '12px', textAlign: 'center', color: '#1D9E75', fontWeight: '600', fontSize: '14px', marginBottom: '16px' }}>
                  ✅ You're in this challenge!
                </div>
              ) : (
                <button onClick={() => joinChallenge(selectedChallenge.id)} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '16px' }}>
                  🏆 Join Challenge
                </button>
              )
            )}
          </div>

          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #1a1a1a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>🏅 Leaderboard</div>
              <button onClick={() => loadLeaderboard(selectedChallenge.id)} style={{ fontSize: '12px', color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Refresh</button>
            </div>

            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#555', fontSize: '13px' }}>
                No entries yet — be the first to join!
              </div>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', backgroundColor: i === 0 ? 'rgba(245,158,11,0.1)' : '#0a0a0a', borderRadius: '12px', marginBottom: '8px', border: `1px solid ${i === 0 ? 'rgba(245,158,11,0.3)' : '#1a1a1a'}` }}>
                  <div style={{ fontSize: '18px', width: '28px', textAlign: 'center' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </div>
                  <div style={{ flex: 1, fontSize: '14px', fontWeight: i === 0 ? '700' : '500' }}>{entry.name}</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: i === 0 ? '#f59e0b' : '#555' }}>{entry.score}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── CREATE FORM ───────────────────────────────────────────────
  if (showCreate) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
        <div style={{ padding: '56px 20px 16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { setShowCreate(false); resetEventForm(); resetChallengeForm() }} style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
          <div style={{ fontSize: '18px', fontWeight: '800' }}>Create</div>
        </div>

        <div style={{ padding: '0 20px 100px 20px' }}>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '4px', marginBottom: '16px' }}>
            {[{ id: 'event', label: '📅 Event' }, { id: 'challenge', label: '🏆 Challenge' }].map(opt => (
              <button key={opt.id} onClick={() => setCreateType(opt.id)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: createType === opt.id ? '#1D9E75' : 'transparent', color: createType === opt.id ? 'white' : '#555', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                {opt.label}
              </button>
            ))}
          </div>

          {createType === 'event' ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event type</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {eventTypes.map(et => (
                    <button key={et.id} onClick={() => setEventType(et.id)} style={{ padding: '14px 16px', borderRadius: '12px', border: `1px solid ${eventType === et.id ? '#1D9E75' : '#222'}`, backgroundColor: eventType === et.id ? 'rgba(29,158,117,0.1)' : '#111', color: eventType === et.id ? '#1D9E75' : '#aaa', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
                      {et.label}
                      <div style={{ fontSize: '11px', color: '#555', fontWeight: '400', marginTop: '2px' }}>{et.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</label>
                <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="e.g. Sunday morning footy" style={{ width: '100%', padding: '12px 14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sport</label>
                <select value={eventSport} onChange={e => setEventSport(e.target.value)} style={{ width: '100%', padding: '12px 14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: eventSport ? 'white' : '#555', fontSize: '14px', outline: 'none' }}>
                  <option value="">Select sport...</option>
                  {sports.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</label>
                <input value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="e.g. Centennial Park, Sydney" style={{ width: '100%', padding: '12px 14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</label>
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</label>
                  <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} style={{ width: '100%', padding: '12px 14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max players</label>
                  <select value={eventMaxPlayers} onChange={e => setEventMaxPlayers(e.target.value)} style={{ width: '100%', padding: '12px 14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}>
                    {[5,6,8,10,12,15,20,25,30,50].map(n => <option key={n} value={n}>{n} players</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skill level</label>
                  <select value={eventSkill} onChange={e => setEventSkill(e.target.value)} style={{ width: '100%', padding: '12px 14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}>
                    {skillLevels.map(s => <option key={s} value={s}>{s === 'all' ? 'All levels' : s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes (optional)</label>
                <textarea value={eventNotes} onChange={e => setEventNotes(e.target.value)} placeholder="Any extra details, what to bring, contact info..." style={{ width: '100%', padding: '12px 14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Public event</div>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>Anyone on CoachFlow can see and join</div>
                </div>
                <button onClick={() => setEventPublic(!eventPublic)} style={{ width: '48px', height: '28px', borderRadius: '14px', backgroundColor: eventPublic ? '#1D9E75' : '#222', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: eventPublic ? '23px' : '3px', transition: 'left 0.2s' }} />
                </button>
              </div>

              <button onClick={createEvent} disabled={savingEvent} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                {savingEvent ? 'Creating...' : '✓ Create Event'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Challenge title</label>
                <input value={challengeTitle} onChange={e => setChallengeTitle(e.target.value)} placeholder="e.g. Most sessions this week" style={{ width: '100%', padding: '12px 14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</label>
                <textarea value={challengeDesc} onChange={e => setChallengeDesc(e.target.value)} placeholder="What are you challenging people to do?" style={{ width: '100%', padding: '12px 14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>What are you measuring?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.entries(metricLabel).map(([key, label]) => (
                    <button key={key} onClick={() => setChallengeMetric(key)} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: `1px solid ${challengeMetric === key ? '#f59e0b' : '#222'}`, backgroundColor: challengeMetric === key ? 'rgba(245,158,11,0.1)' : '#111', color: challengeMetric === key ? '#f59e0b' : '#555', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>End date (optional)</label>
                <input type="date" value={challengeEnd} onChange={e => setChallengeEnd(e.target.value)} style={{ width: '100%', padding: '12px 14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Public challenge</div>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>Anyone on CoachFlow can join</div>
                </div>
                <button onClick={() => setChallengePublic(!challengePublic)} style={{ width: '48px', height: '28px', borderRadius: '14px', backgroundColor: challengePublic ? '#1D9E75' : '#222', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: challengePublic ? '23px' : '3px', transition: 'left 0.2s' }} />
                </button>
              </div>

              <button onClick={createChallenge} disabled={savingChallenge} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                {savingChallenge ? 'Creating...' : '🏆 Create Challenge'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── MAIN VIEW ─────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>

      {/* Header */}
      <div style={{ padding: '56px 20px 16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Play</div>
          <div style={{ fontSize: '14px', color: '#555', marginTop: '2px' }}>Events, games & challenges</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          + Create
        </button>
      </div>

      {/* Section tabs */}
      <div style={{ padding: '0 20px 16px 20px' }}>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '4px' }}>
          {[
            { id: 'events', label: '📅 Events' },
            { id: 'challenges', label: '🏆 Challenges' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: activeSection === tab.id ? '#1D9E75' : 'transparent', color: activeSection === tab.id ? 'white' : '#555', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 24px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>Loading...</div>
        ) : activeSection === 'events' ? (
          <>
            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px' }}>🔍</span>
              <input
                type="text"
                placeholder="Search events by title, location or sport..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '12px 14px 12px 40px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '14px', fontSize: '13px', color: 'white', outline: 'none', fontFamily: 'inherit' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#555', fontSize: '16px', cursor: 'pointer', padding: '0' }}>✕</button>
              )}
            </div>

            {/* Event type filter chips */}
            <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', paddingBottom: '4px' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pickup', label: '🏃 Pick-up' },
                  { id: 'practice', label: '🎯 Practice' },
                  { id: 'open_session', label: '⚡ Open session' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    style={{
                      padding: '7px 14px', borderRadius: '20px',
                      border: `1px solid ${filterType === f.id ? '#1D9E75' : '#222'}`,
                      backgroundColor: filterType === f.id ? 'rgba(29,158,117,0.15)' : 'transparent',
                      color: filterType === f.id ? '#1D9E75' : '#555',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sport filter chips — only show if events have sports */}
            {allSports.length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', paddingBottom: '4px' }}>
                  <button
                    onClick={() => setFilterSport('')}
                    style={{ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${!filterSport ? '#6366f1' : '#222'}`, backgroundColor: !filterSport ? 'rgba(99,102,241,0.15)' : 'transparent', color: !filterSport ? '#818cf8' : '#555', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    All sports
                  </button>
                  {allSports.map(sport => (
                    <button
                      key={sport}
                      onClick={() => setFilterSport(filterSport === sport ? '' : sport)}
                      style={{ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${filterSport === sport ? '#6366f1' : '#222'}`, backgroundColor: filterSport === sport ? 'rgba(99,102,241,0.15)' : 'transparent', color: filterSport === sport ? '#818cf8' : '#555', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results count */}
            <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '12px' }}>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
              {(searchQuery || filterType !== 'all' || filterSport) && (
                <button onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterSport('') }} style={{ marginLeft: '10px', fontSize: '11px', color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                  Clear filters
                </button>
              )}
            </div>

            {filteredEvents.length === 0 ? (
              <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>
                  {events.length === 0 ? 'No events yet' : 'No events match your filters'}
                </div>
                <div style={{ fontSize: '13px', color: '#555' }}>
                  {events.length === 0 ? 'Be the first — create a pick-up game or open session!' : 'Try adjusting your search or filters'}
                </div>
              </div>
            ) : (
              filteredEvents.map((event, i) => {
                const isAttending = myAttendance.includes(event.id)
                return (
                  <div key={i} onClick={() => setSelectedEvent(event)} style={{ backgroundColor: '#111', borderRadius: '20px', padding: '20px', marginBottom: '12px', border: `1px solid ${isAttending ? 'rgba(29,158,117,0.4)' : '#1a1a1a'}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '16px' }}>{typeEmoji[event.type]}</span>
                          <div style={{ fontSize: '16px', fontWeight: '700' }}>{event.title}</div>
                        </div>
                        {event.sport && <div style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '600', marginBottom: '6px' }}>🏅 {event.sport}</div>}
                        <div style={{ fontSize: '12px', color: '#555' }}>📍 {event.location}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '600', backgroundColor: 'rgba(29,158,117,0.1)', padding: '3px 8px', borderRadius: '20px', marginBottom: '4px' }}>{timeUntil(event.event_date)}</div>
                        {isAttending && <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '600' }}>✅ Going</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#555' }}>📅 {formatEventDate(event.event_date)}</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: skillColor[event.skill_level] || '#555', backgroundColor: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '20px', border: `1px solid ${skillColor[event.skill_level] || '#333'}`, fontWeight: '600' }}>
                          {event.skill_level === 'all' ? 'All levels' : event.skill_level}
                        </span>
                        <span style={{ fontSize: '11px', color: '#555', backgroundColor: '#1a1a1a', padding: '3px 8px', borderRadius: '20px', fontWeight: '600' }}>
                          👥 {event.max_players}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </>
        ) : (
          <>
            {challenges.length === 0 ? (
              <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>No challenges yet</div>
                <div style={{ fontSize: '13px', color: '#555' }}>Create a challenge and see who comes out on top!</div>
              </div>
            ) : (
              challenges.map((challenge, i) => {
                const isJoined = myEntries.includes(challenge.id)
                const isActive = !challenge.ends_at || new Date(challenge.ends_at) > new Date()
                return (
                  <div key={i} onClick={() => { setSelectedChallenge(challenge); loadLeaderboard(challenge.id) }} style={{ backgroundColor: '#111', borderRadius: '20px', padding: '20px', marginBottom: '12px', border: `1px solid ${isJoined ? 'rgba(245,158,11,0.3)' : '#1a1a1a'}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{challenge.title}</div>
                        {challenge.description && <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.4' }}>{challenge.description}</div>}
                      </div>
                      <div style={{ marginLeft: '12px', flexShrink: 0 }}>
                        {isJoined && <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>✅ Joined</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', border: '1px solid rgba(245,158,11,0.3)' }}>
                        📊 {metricLabel[challenge.metric]}
                      </span>
                      <span style={{ fontSize: '11px', backgroundColor: isActive ? 'rgba(29,158,117,0.1)' : '#1a1a1a', color: isActive ? '#1D9E75' : '#555', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>
                        {isActive ? '🟢 Active' : '🔴 Ended'}
                      </span>
                      {challenge.ends_at && (
                        <span style={{ fontSize: '11px', color: '#555', backgroundColor: '#1a1a1a', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>
                          📅 {new Date(challenge.ends_at).toLocaleDateString('en-AU')}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PlayTab