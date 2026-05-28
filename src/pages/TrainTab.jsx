import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function TrainTab({ userId, role, initialProgramme, onClearProgramme }) {
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProg, setSelectedProg] = useState(initialProgramme || null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [completedActivities, setCompletedActivities] = useState({})
  const [submitted, setSubmitted] = useState({})
  const [submissionData, setSubmissionData] = useState({})
  const [notes, setNotes] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [studentNames, setStudentNames] = useState({})
  const [uploadedVideos, setUploadedVideos] = useState({})
  const [uploadingVideos, setUploadingVideos] = useState({})

  const [progName, setProgName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [repeatWeekly, setRepeatWeekly] = useState(false)
  const [repeatWeeks, setRepeatWeeks] = useState(4)
  const [startDate, setStartDate] = useState('')
  const [sessions, setSessions] = useState([])
  const [sessionLabelType, setSessionLabelType] = useState('numbered')
  const [saving, setSaving] = useState(false)

  const [newSessionName, setNewSessionName] = useState('')
  const [activeSessionIndex, setActiveSessionIndex] = useState(null)
  const [newActivityName, setNewActivityName] = useState('')
  const [newActivitySets, setNewActivitySets] = useState('3')
  const [newActivityReps, setNewActivityReps] = useState('10')
  const [newActivityRepType, setNewActivityRepType] = useState('reps')
  const [newActivityDuration, setNewActivityDuration] = useState('')
  const [newActivityVideo, setNewActivityVideo] = useState(false)

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    if (initialProgramme) setSelectedProg(initialProgramme)
  }, [initialProgramme])

  useEffect(() => { loadProgrammes() }, [userId])

  useEffect(() => {
    if (role === 'student' && selectedProg) {
      loadProgress(selectedProg.id)
      loadSubmissions(selectedProg.id)
    }
  }, [selectedProg])

  async function loadProgress(programmeId) {
    const { data } = await supabase
      .from('activity_progress')
      .select('*')
      .eq('student_id', userId)
      .eq('programme_id', programmeId)

    if (data) {
      const map = {}
      data.forEach(row => {
        if (row.completed) {
          map[`${programmeId}-${row.session_index}-${row.activity_index}`] = true
        }
      })
      setCompletedActivities(prev => ({ ...prev, ...map }))
    }
  }

  async function loadSubmissions(programmeId) {
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .eq('programme_id', programmeId)
      .eq('student_id', userId)

    if (data) {
      const map = {}
      const dataMap = {}
      data.forEach(row => {
        const si = row.session_index ?? 0
        map[`${programmeId}-${si}`] = true
        dataMap[`${programmeId}-${si}`] = row
      })
      setSubmitted(prev => ({ ...prev, ...map }))
      setSubmissionData(prev => ({ ...prev, ...dataMap }))
    }
  }

  async function loadProgrammes() {
    setLoading(true)
    let progs = []
    if (role === 'coach') {
      const { data } = await supabase
        .from('programmes')
        .select('*')
        .eq('coach_id', userId)
        .order('created_at', { ascending: false })
      progs = data || []

      const emails = [...new Set(progs.map(p => p.student_email))]
      const nameMap = {}
      await Promise.all(emails.map(async (email) => {
        const { data: prof } = await supabase.from('profiles').select('id').eq('email', email).single()
        if (prof) {
          const { data: sp } = await supabase.from('student_profiles').select('name').eq('id', prof.id).single()
          nameMap[email] = sp?.name || email
        } else {
          nameMap[email] = email
        }
      }))
      setStudentNames(nameMap)
    } else {
      const { data: prof } = await supabase.from('profiles').select('email').eq('id', userId).single()
      if (prof) {
        const { data } = await supabase.from('programmes').select('*').eq('student_email', prof.email)
        progs = data || []
      }
    }
    setProgrammes(progs)
    setLoading(false)
  }

  function addSession() {
    const label = sessionLabelType === 'numbered'
      ? `Session ${sessions.length + 1}`
      : newSessionName || `Session ${sessions.length + 1}`
    setSessions([...sessions, { name: label, activities: [] }])
    setNewSessionName('')
    setActiveSessionIndex(sessions.length)
  }

  function addActivity(sessionIndex) {
    if (!newActivityName.trim()) { alert('Enter an activity name!'); return }
    let detail = ''
    if (newActivityRepType === 'reps') detail = `${newActivitySets} sets × ${newActivityReps} reps`
    else if (newActivityRepType === 'amrap') detail = `${newActivitySets} sets × AMRAP`
    else if (newActivityRepType === 'time') detail = `${newActivitySets} sets × ${newActivityDuration}`
    const updated = [...sessions]
    updated[sessionIndex].activities.push({ name: newActivityName.trim(), detail, requiresVideo: newActivityVideo })
    setSessions(updated)
    setNewActivityName(''); setNewActivitySets('3'); setNewActivityReps('10')
    setNewActivityDuration(''); setNewActivityRepType('reps'); setNewActivityVideo(false)
  }

  function removeActivity(sessionIndex, actIndex) {
    const updated = [...sessions]
    updated[sessionIndex].activities = updated[sessionIndex].activities.filter((_, i) => i !== actIndex)
    setSessions(updated)
  }

  function removeSession(sessionIndex) {
    setSessions(sessions.filter((_, i) => i !== sessionIndex))
    if (activeSessionIndex === sessionIndex) setActiveSessionIndex(null)
  }

  async function saveProgamme() {
    if (!progName.trim() || !studentEmail.trim()) { alert('Fill in programme name and student email!'); return }
    if (sessions.length === 0) { alert('Add at least one session!'); return }
    setSaving(true)
    const endDate = repeatWeekly && startDate
      ? new Date(new Date(startDate).getTime() + repeatWeeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : startDate
    const { error } = await supabase.from('programmes').insert([{
      coach_id: userId,
      student_email: studentEmail.trim().toLowerCase(),
      name: progName.trim(),
      due_date: endDate,
      activities: sessions[0]?.activities || [],
      sessions,
      repeat_weekly: repeatWeekly,
      repeat_weeks: repeatWeeks,
      end_date: endDate,
    }])
    if (error) { alert('Error saving: ' + error.message); setSaving(false); return }
    setShowCreate(false)
    resetCreateForm()
    loadProgrammes()
    setSaving(false)
  }

  function resetCreateForm() {
    setProgName(''); setStudentEmail(''); setRepeatWeekly(false)
    setRepeatWeeks(4); setStartDate(''); setSessions([])
    setSessionLabelType('numbered'); setActiveSessionIndex(null)
  }

  async function toggleActivity(progId, sessionIdx, actIdx) {
    const key = `${progId}-${sessionIdx}-${actIdx}`
    const isDone = !!completedActivities[key]
    const newValue = !isDone
    setCompletedActivities(prev => ({ ...prev, [key]: newValue }))
    const { error } = await supabase
      .from('activity_progress')
      .upsert({
        student_id: userId,
        programme_id: progId,
        session_index: sessionIdx,
        activity_index: actIdx,
        completed: newValue,
      }, { onConflict: 'student_id,programme_id,session_index,activity_index' })
    if (error) {
      console.error('Error saving progress:', error.message)
      setCompletedActivities(prev => ({ ...prev, [key]: isDone }))
    }
  }

  function isActivityDone(progId, sessionIdx, actIdx) {
    return !!completedActivities[`${progId}-${sessionIdx}-${actIdx}`]
  }

  async function handleVideoUpload(progId, sessionIdx, actIdx, file) {
    const key = `${progId}-${sessionIdx}-${actIdx}`
    setUploadingVideos(prev => ({ ...prev, [key]: true }))
    const filePath = `${userId}/${progId}/${sessionIdx}/${actIdx}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('videos').upload(filePath, file, { upsert: true })
    if (error) {
      alert('Error uploading video: ' + error.message)
      setUploadingVideos(prev => ({ ...prev, [key]: false }))
      return
    }
    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filePath)
    setUploadedVideos(prev => ({ ...prev, [key]: { name: file.name, url: urlData.publicUrl } }))
    setUploadingVideos(prev => ({ ...prev, [key]: false }))
  }

  async function handleSubmitSession(progId, sessionIdx) {
    const progSessions = selectedProg?.sessions?.length > 0
      ? selectedProg.sessions
      : [{ name: 'Session 1', activities: selectedProg?.activities || [] }]
    const acts = progSessions[sessionIdx]?.activities || []
    const completed = acts.map((_, i) => isActivityDone(progId, sessionIdx, i) ? i : null).filter(i => i !== null)
    if (completed.length === 0) { alert('Tick off at least one activity!'); return }

    const videoUrls = {}
    Object.keys(uploadedVideos).forEach(key => {
      if (key.startsWith(`${progId}-${sessionIdx}-`)) {
        const actIdx = key.split('-')[2]
        videoUrls[actIdx] = uploadedVideos[key].url
      }
    })

    const { error } = await supabase.from('submissions').insert([{
      programme_id: progId,
      student_id: userId,
      notes: notes[`${progId}-${sessionIdx}`] || '',
      completed_activities: completed,
      video_urls: videoUrls,
      session_index: sessionIdx,
    }])
    if (error) { alert('Error: ' + error.message); return }
    setSubmitted(prev => ({ ...prev, [`${progId}-${sessionIdx}`]: true }))
    setSubmissionData(prev => ({ ...prev, [`${progId}-${sessionIdx}`]: { coach_feedback: null } }))
  }

  function handleBack() {
    if (selectedSession !== null) { setSelectedSession(null); return }
    setSelectedProg(null)
    if (onClearProgramme) onClearProgramme()
  }

  // ── CREATE FORM ───────────────────────────────────────────────
  if (showCreate) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
        <div style={{ padding: '56px 20px 16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { setShowCreate(false); resetCreateForm() }} style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
          <div style={{ fontSize: '18px', fontWeight: '800' }}>New Programme</div>
        </div>

        <div style={{ padding: '0 20px 100px 20px' }}>
          <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Programme Details</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px' }}>Programme name</label>
              <input value={progName} onChange={e => setProgName(e.target.value)} placeholder="e.g. Pre-season Block" style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px' }}>Student email</label>
              <input value={studentEmail} onChange={e => setStudentEmail(e.target.value)} placeholder="student@email.com" style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px' }}>Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>

          <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: repeatWeekly ? '16px' : '0' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Repeat weekly</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>Same sessions repeat each week</div>
              </div>
              <button onClick={() => setRepeatWeekly(!repeatWeekly)} style={{ width: '48px', height: '28px', borderRadius: '14px', backgroundColor: repeatWeekly ? '#1D9E75' : '#222', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: repeatWeekly ? '23px' : '3px', transition: 'left 0.2s' }} />
              </button>
            </div>
            {repeatWeekly && (
              <div>
                <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '8px' }}>Number of weeks</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[2, 4, 6, 8, 12, 16].map(w => (
                    <button key={w} onClick={() => setRepeatWeeks(w)} style={{ padding: '8px 16px', borderRadius: '20px', border: `1px solid ${repeatWeeks === w ? '#1D9E75' : '#222'}`, backgroundColor: repeatWeeks === w ? 'rgba(29,158,117,0.15)' : 'transparent', color: repeatWeeks === w ? '#1D9E75' : '#555', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{w}w</button>
                  ))}
                </div>
                {startDate && <div style={{ fontSize: '12px', color: '#1D9E75', marginTop: '10px' }}>📅 Ends {new Date(new Date(startDate).getTime() + repeatWeeks * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AU')}</div>}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Session Labels</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[{ id: 'numbered', label: '1, 2, 3...' }, { id: 'days', label: 'Mon, Tue...' }].map(opt => (
                <button key={opt.id} onClick={() => setSessionLabelType(opt.id)} style={{ flex: 1, padding: '10px', border: `1px solid ${sessionLabelType === opt.id ? '#1D9E75' : '#222'}`, backgroundColor: sessionLabelType === opt.id ? 'rgba(29,158,117,0.15)' : 'transparent', color: sessionLabelType === opt.id ? '#1D9E75' : '#555', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Sessions ({sessions.length})</div>

            {sessions.map((session, si) => (
              <div key={si} style={{ backgroundColor: '#111', borderRadius: '16px', border: '1px solid #1a1a1a', marginBottom: '10px', overflow: 'hidden' }}>
                <div onClick={() => setActiveSessionIndex(activeSessionIndex === si ? null : si)} style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{session.name}</div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{session.activities.length} activities</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={e => { e.stopPropagation(); removeSession(si) }} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: '12px', cursor: 'pointer', padding: '4px 8px' }}>Remove</button>
                    <span style={{ color: '#555', fontSize: '16px' }}>{activeSessionIndex === si ? '▲' : '▼'}</span>
                  </div>
                </div>

                {activeSessionIndex === si && (
                  <div style={{ padding: '0 18px 18px 18px', borderTop: '1px solid #1a1a1a' }}>
                    {session.activities.map((act, ai) => (
                      <div key={ai} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#0a0a0a', borderRadius: '10px', marginBottom: '6px', marginTop: ai === 0 ? '12px' : '0' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>{act.name}</div>
                          <div style={{ fontSize: '11px', color: '#555' }}>{act.detail}</div>
                        </div>
                        <button onClick={() => removeActivity(si, ai)} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}

                    <div style={{ backgroundColor: '#0a0a0a', borderRadius: '12px', padding: '14px', marginTop: '10px', border: '1px dashed #222' }}>
                      <input value={newActivityName} onChange={e => setNewActivityName(e.target.value)} placeholder="Activity name e.g. Push-ups" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none', fontFamily: 'inherit', marginBottom: '8px' }} />
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <select value={newActivitySets} onChange={e => setNewActivitySets(e.target.value)} style={{ flex: 1, padding: '8px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', color: 'white', fontSize: '12px', outline: 'none' }}>
                          {Array.from({length: 10}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} set{n > 1 ? 's' : ''}</option>)}
                        </select>
                        <select value={newActivityRepType} onChange={e => setNewActivityRepType(e.target.value)} style={{ flex: 1, padding: '8px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', color: 'white', fontSize: '12px', outline: 'none' }}>
                          <option value="reps">Reps</option>
                          <option value="amrap">AMRAP</option>
                          <option value="time">Time</option>
                        </select>
                        {newActivityRepType === 'reps' && (
                          <select value={newActivityReps} onChange={e => setNewActivityReps(e.target.value)} style={{ flex: 1, padding: '8px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', color: 'white', fontSize: '12px', outline: 'none' }}>
                            {Array.from({length: 20}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} rep{n > 1 ? 's' : ''}</option>)}
                          </select>
                        )}
                        {newActivityRepType === 'time' && (
                          <select value={newActivityDuration} onChange={e => setNewActivityDuration(e.target.value)} style={{ flex: 1, padding: '8px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', color: 'white', fontSize: '12px', outline: 'none' }}>
                            <option value="">Select...</option>
                            {['15 sec','20 sec','30 sec','45 sec','1 min','90 sec','2 min','3 min','5 min','10 min','15 min','20 min','30 min'].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        )}
                        {newActivityRepType === 'amrap' && (
                          <div style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(29,158,117,0.1)', borderRadius: '8px', fontSize: '11px', color: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>AMRAP</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555', cursor: 'pointer' }}>
                          <input type="checkbox" checked={newActivityVideo} onChange={e => setNewActivityVideo(e.target.checked)} />
                          Require video
                        </label>
                        <button onClick={() => addActivity(si)} style={{ padding: '8px 16px', backgroundColor: '#1D9E75', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Add</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {sessionLabelType === 'days' && (
                <select value={newSessionName} onChange={e => setNewSessionName(e.target.value)} style={{ flex: 1, padding: '12px 14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '13px', outline: 'none' }}>
                  <option value="">Select day...</option>
                  {days.filter(d => !sessions.find(s => s.name === d)).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
              <button onClick={addSession} style={{ flex: sessionLabelType === 'days' ? 'none' : 1, padding: '12px 20px', backgroundColor: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '12px', color: '#1D9E75', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ Add Session</button>
            </div>
          </div>

          <button onClick={saveProgamme} disabled={saving} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>
            {saving ? 'Saving...' : '✓ Save Programme'}
          </button>
        </div>
      </div>
    )
  }

  // ── PROGRAMME DETAIL (sessions list) ─────────────────────────
  if (selectedProg && selectedSession === null) {
    const progSessions = selectedProg.sessions?.length > 0
      ? selectedProg.sessions
      : (selectedProg.activities?.length > 0 ? [{ name: 'Session 1', activities: selectedProg.activities }] : [])

    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
        <div style={{ padding: '56px 20px 16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleBack} style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>{selectedProg.name}</div>
            {role === 'coach' && <div style={{ fontSize: '13px', color: '#555' }}>👤 {studentNames[selectedProg.student_email] || selectedProg.student_email}</div>}
            {selectedProg.repeat_weekly && <div style={{ fontSize: '12px', color: '#1D9E75', marginTop: '4px' }}>🔁 Repeats weekly · {selectedProg.repeat_weeks} weeks</div>}
            {selectedProg.end_date && <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>📅 Ends {selectedProg.end_date}</div>}
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Sessions</div>

            {progSessions.length === 0 ? (
              <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid #1a1a1a', color: '#555' }}>No sessions added yet</div>
            ) : (
              progSessions.map((session, si) => {
                const acts = session.activities || []
                const doneCount = acts.filter((_, ai) => isActivityDone(selectedProg.id, si, ai)).length
                const isSubmittedSession = submitted[`${selectedProg.id}-${si}`]
                const progress = acts.length > 0 ? Math.round((doneCount / acts.length) * 100) : 0

                return (
                  <div key={si} onClick={() => setSelectedSession(si)} style={{ backgroundColor: '#111', borderRadius: '16px', padding: '18px 20px', marginBottom: '10px', border: `1px solid ${isSubmittedSession ? 'rgba(29,158,117,0.4)' : '#1a1a1a'}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700' }}>{session.name}</div>
                        <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{acts.length} activities</div>
                      </div>
                      {isSubmittedSession
                        ? <span style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '700', backgroundColor: 'rgba(29,158,117,0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(29,158,117,0.3)' }}>✓ Done</span>
                        : <span style={{ fontSize: '13px', fontWeight: '700', color: progress > 0 ? '#1D9E75' : '#555' }}>{progress}%</span>
                      }
                    </div>
                    <div style={{ height: '4px', backgroundColor: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: isSubmittedSession ? '#1D9E75' : '#333', borderRadius: '2px', width: isSubmittedSession ? '100%' : `${progress}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── SESSION DETAIL (activities) ───────────────────────────────
  if (selectedProg && selectedSession !== null) {
    const progSessions = selectedProg.sessions?.length > 0
      ? selectedProg.sessions
      : [{ name: 'Session 1', activities: selectedProg.activities || [] }]
    const session = progSessions[selectedSession]
    const acts = session?.activities || []
    const isSubmittedSession = submitted[`${selectedProg.id}-${selectedSession}`]
    const doneCount = acts.filter((_, ai) => isActivityDone(selectedProg.id, selectedSession, ai)).length
    const progress = acts.length > 0 ? Math.round((doneCount / acts.length) * 100) : 0
    const noteKey = `${selectedProg.id}-${selectedSession}`

    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
        <div style={{ padding: '56px 20px 16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSelectedSession(null)} style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
          <div style={{ fontSize: '16px', fontWeight: '700' }}>{session?.name}</div>
        </div>

        <div style={{ padding: '0 20px 40px 20px' }}>
          <div style={{ backgroundColor: '#111', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '1px solid #1a1a1a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#aaa' }}>Progress</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1D9E75' }}>{doneCount}/{acts.length}</span>
            </div>
            <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: '#1D9E75', borderRadius: '3px', width: `${progress}%`, transition: 'width 0.3s' }} />
            </div>
          </div>

          {acts.map((act, ai) => {
            const isDone = isActivityDone(selectedProg.id, selectedSession, ai)
            const key = `${selectedProg.id}-${selectedSession}-${ai}`
            const isUploading = uploadingVideos[key]
            const videoUploaded = uploadedVideos[key]

            return (
              <div key={ai} style={{ backgroundColor: isDone ? 'rgba(29,158,117,0.1)' : '#111', border: `1px solid ${isDone ? 'rgba(29,158,117,0.4)' : '#1a1a1a'}`, borderRadius: '14px', padding: '16px', marginBottom: '10px', transition: 'all 0.15s' }}>
                <div onClick={() => !isSubmittedSession && toggleActivity(selectedProg.id, selectedSession, ai)} style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: isSubmittedSession ? 'default' : 'pointer' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${isDone ? '#1D9E75' : '#333'}`, backgroundColor: isDone ? '#1D9E75' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', color: 'white' }}>
                    {isDone && '✓'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: isDone ? '#1D9E75' : 'white' }}>{act.name}</div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{act.detail}</div>
                  </div>
                  {act.requiresVideo && <span style={{ fontSize: '10px', backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '3px 8px', borderRadius: '20px', fontWeight: '600', border: '1px solid rgba(245,158,11,0.3)', whiteSpace: 'nowrap' }}>📹 VIDEO</span>}
                </div>

                {role === 'student' && act.requiresVideo && isDone && !isSubmittedSession && (
                  <div style={{ marginTop: '12px', paddingLeft: '42px' }}>
                    {isUploading ? (
                      <div style={{ fontSize: '13px', color: '#1D9E75' }}>⏳ Uploading...</div>
                    ) : videoUploaded ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#1D9E75', fontWeight: '500' }}>✅ {videoUploaded.name}</span>
                        <label htmlFor={`vid-${key}`} style={{ fontSize: '12px', color: '#555', cursor: 'pointer', textDecoration: 'underline' }}>Change</label>
                        <input id={`vid-${key}`} type="file" accept="video/*" capture="camcorder" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleVideoUpload(selectedProg.id, selectedSession, ai, e.target.files[0]) }} />
                      </div>
                    ) : (
                      <div>
                        <label htmlFor={`vid-${key}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: '#f59e0b', fontWeight: '600' }}>
                          📹 Upload video
                        </label>
                        <input id={`vid-${key}`} type="file" accept="video/*" capture="camcorder" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleVideoUpload(selectedProg.id, selectedSession, ai, e.target.files[0]) }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {role === 'student' && !isSubmittedSession && (
            <div style={{ marginTop: '16px' }}>
              <textarea
                placeholder="Notes for your coach..."
                value={notes[noteKey] || ''}
                onChange={e => setNotes({ ...notes, [noteKey]: e.target.value })}
                style={{ width: '100%', padding: '14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', minHeight: '80px', fontFamily: 'inherit', marginBottom: '12px' }}
              />
              <button onClick={() => handleSubmitSession(selectedProg.id, selectedSession)} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                Submit Session →
              </button>
            </div>
          )}

          {isSubmittedSession && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ backgroundColor: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '14px', padding: '20px', textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>✅</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1D9E75' }}>Session submitted!</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>Your coach will review and get back to you</div>
              </div>

              {submissionData[noteKey]?.coach_feedback ? (
                <div style={{ backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>💬 Coach feedback</div>
                  <div style={{ fontSize: '14px', color: 'white', lineHeight: '1.6' }}>{submissionData[noteKey].coach_feedback}</div>
                </div>
              ) : (
                <div style={{ backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#555' }}>⏳ Waiting for coach feedback...</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── PROGRAMME LIST ────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <div style={{ padding: '56px 20px 16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Train</div>
          <div style={{ fontSize: '14px', color: '#555', marginTop: '2px' }}>{role === 'coach' ? 'Your programmes' : 'Your training'}</div>
        </div>
        {role === 'coach' && (
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            + Create
          </button>
        )}
      </div>

      <div style={{ padding: '0 20px 24px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>Loading...</div>
        ) : programmes.length === 0 ? (
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏋️</div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>No programmes yet</div>
            <div style={{ fontSize: '13px', color: '#555' }}>{role === 'coach' ? 'Tap + Create to get started' : 'Your coach will assign one soon'}</div>
          </div>
        ) : (
          programmes.map((prog, i) => {
            const progSessions = prog.sessions?.length > 0
              ? prog.sessions
              : (prog.activities?.length > 0 ? [{ name: 'Session 1', activities: prog.activities }] : [])
            const displayName = role === 'coach' ? (studentNames[prog.student_email] || prog.student_email) : null

            return (
              <div key={i} onClick={() => setSelectedProg(prog)} style={{ backgroundColor: '#111', borderRadius: '20px', padding: '20px', marginBottom: '12px', border: '1px solid #1a1a1a', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{prog.name}</div>
                    {displayName && <div style={{ fontSize: '12px', color: '#555' }}>👤 {displayName}</div>}
                    {!displayName && <div style={{ fontSize: '12px', color: '#555' }}>📅 Due {prog.due_date || 'No date'}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {prog.repeat_weekly && <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '600' }}>🔁 {prog.repeat_weeks}w</div>}
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{progSessions.length} sessions</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {progSessions.slice(0, 4).map((s, si) => (
                    <span key={si} style={{ padding: '3px 10px', backgroundColor: '#1a1a1a', borderRadius: '20px', fontSize: '11px', color: '#666', fontWeight: '500' }}>{s.name}</span>
                  ))}
                  {progSessions.length > 4 && <span style={{ fontSize: '11px', color: '#555' }}>+{progSessions.length - 4} more</span>}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TrainTab