import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import StudentProfile from './StudentProfile'
import MessagesPage from './MessagesPage'

function StudentDashboard({ onSignOut, userId }) {
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [completedActivities, setCompletedActivities] = useState({})
  const [submitted, setSubmitted] = useState({})
  const [submissionData, setSubmissionData] = useState({})
  const [showProfile, setShowProfile] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [notes, setNotes] = useState({})
  const [uploadedVideos, setUploadedVideos] = useState({})
  const [uploadingVideos, setUploadingVideos] = useState({})
  const [pendingInvites, setPendingInvites] = useState([])
  const [showInvites, setShowInvites] = useState(false)

  useEffect(() => {
    loadProgrammes()
    loadPendingInvites()
  }, [userId])

  async function loadPendingInvites() {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()
    if (!profile) return

    const { data } = await supabase
      .from('coach_students')
      .select('*')
      .eq('student_email', profile.email)
      .eq('status', 'pending')

    const enriched = await Promise.all((data || []).map(async (invite) => {
      const { data: coachProfile } = await supabase
        .from('coach_profiles')
        .select('name')
        .eq('id', invite.coach_id)
        .single()
      return { ...invite, coachName: coachProfile?.name || 'A coach' }
    }))
    setPendingInvites(enriched)
  }

  async function acceptInvite(invite) {
    await supabase.from('coach_students').update({ status: 'accepted', student_id: userId }).eq('id', invite.id)
    loadPendingInvites()
  }

  async function declineInvite(invite) {
    await supabase.from('coach_students').update({ status: 'declined' }).eq('id', invite.id)
    loadPendingInvites()
  }

  async function loadProgrammes() {
    setLoading(true)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (profileError || !profile) { setLoading(false); return }

    const { data, error } = await supabase
      .from('programmes')
      .select('*')
      .eq('student_email', profile.email)

    if (!error && data) {
      setProgrammes(data)
      // Load progress and submissions for all programmes
      await Promise.all(data.map(prog => Promise.all([
        loadProgress(prog.id),
        loadSubmissions(prog.id)
      ])))
    }
    setLoading(false)
  }

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
          // For StudentDashboard, sessions are flat (no sessions), so use session_index 0
          const key = `${programmeId}-${row.activity_index}`
          map[key] = true
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
      .limit(1)

    if (data && data.length > 0) {
      setSubmitted(prev => ({ ...prev, [programmeId]: true }))
      setSubmissionData(prev => ({ ...prev, [programmeId]: data[0] }))
    }
  }

  async function toggleActivity(progId, actIndex) {
    const key = `${progId}-${actIndex}`
    const isDone = !!completedActivities[key]
    const newValue = !isDone

    // Update locally immediately
    setCompletedActivities(prev => ({ ...prev, [key]: newValue }))

    // Save to Supabase
    const { error } = await supabase
      .from('activity_progress')
      .upsert({
        student_id: userId,
        programme_id: progId,
        session_index: 0,
        activity_index: actIndex,
        completed: newValue,
      }, { onConflict: 'student_id,programme_id,session_index,activity_index' })

    if (error) {
      console.error('Error saving progress:', error.message)
      // Revert if failed
      setCompletedActivities(prev => ({ ...prev, [key]: isDone }))
    }
  }

  function isCompleted(progId, actIndex) {
    return !!completedActivities[`${progId}-${actIndex}`]
  }

  // Count completed activities for a programme
  function getCompletedList(progId, acts) {
    return acts.map((_, i) => isCompleted(progId, i) ? i : null).filter(i => i !== null)
  }

  async function handleVideoUpload(progId, actIndex, file) {
    const key = `${progId}-${actIndex}`
    setUploadingVideos(prev => ({ ...prev, [key]: true }))

    const filePath = `${userId}/${progId}/0/${actIndex}/${Date.now()}-${file.name}`
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

  async function handleSubmit(progId, acts) {
    const completed = getCompletedList(progId, acts)
    if (completed.length === 0) {
      alert('Please tick off at least one activity before submitting!')
      return
    }

    const videoUrls = {}
    Object.keys(uploadedVideos).forEach(key => {
      if (key.startsWith(`${progId}-`)) {
        const actIndex = key.split('-')[1]
        videoUrls[actIndex] = uploadedVideos[key].url
      }
    })

    const { error } = await supabase.from('submissions').insert([{
      programme_id: progId,
      student_id: userId,
      notes: notes[progId] || '',
      completed_activities: completed,
      video_urls: videoUrls,
      session_index: 0,
    }])

    if (error) { alert('Error submitting: ' + error.message); return }
    setSubmitted(prev => ({ ...prev, [progId]: true }))
    setSubmissionData(prev => ({ ...prev, [progId]: { coach_feedback: null } }))
  }

  if (showProfile) return <StudentProfile userId={userId} onBack={() => setShowProfile(false)} />
  if (showMessages) return <MessagesPage userId={userId} role="student" onBack={() => setShowMessages(false)} />

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '15px', color: '#888' }}>Loading your programmes...</div>
      </div>
    )
  }

  // Total completed across all programmes
  const totalCompleted = Object.values(completedActivities).filter(Boolean).length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5' }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #eeeeee', padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          <span style={{ color: '#1D9E75' }}>coach</span>
          <span style={{ color: '#1a1a1a' }}>flow</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => setShowMessages(true)} style={{ padding: '8px 18px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #eee', color: '#555', fontSize: '13px', fontWeight: '500', backgroundColor: 'white' }}>💬 Messages</button>
          {pendingInvites.length > 0 && (
            <button onClick={() => setShowInvites(!showInvites)} style={{ padding: '8px 18px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #F59E0B', color: '#B45309', fontSize: '13px', fontWeight: '600', backgroundColor: '#FFF8E7' }}>
              🔔 {pendingInvites.length} invite{pendingInvites.length > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => setShowProfile(true)} style={{ padding: '8px 18px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #1D9E75', color: '#1D9E75', fontSize: '13px', fontWeight: '500', backgroundColor: 'white' }}>My profile</button>
          <button onClick={onSignOut} style={{ padding: '8px 18px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #eee', color: '#666', fontSize: '13px', fontWeight: '500', backgroundColor: 'white' }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {showInvites && pendingInvites.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #F59E0B', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>🔔 Coach invites</h2>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 16px 0' }}>These coaches want to add you as a student.</p>
            {pendingInvites.map((invite) => (
              <div key={invite.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', backgroundColor: '#FAFAFA', borderRadius: '10px', marginBottom: '10px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: 'white', fontWeight: '600' }}>
                    {invite.coachName[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{invite.coachName}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>wants to add you as a student</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => acceptInvite(invite)} style={{ padding: '7px 16px', backgroundColor: '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Accept</button>
                  <button onClick={() => declineInvite(invite)} style={{ padding: '7px 16px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ffcccc', backgroundColor: '#fff5f5', color: '#cc0000', fontSize: '13px' }}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>My Training</h1>
          <p style={{ color: '#888', marginTop: '4px', fontSize: '15px' }}>Complete your programmes and submit to your coach</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Programmes', value: programmes.length, emoji: '📋' },
            { label: 'Activities done', value: totalCompleted, emoji: '✅' },
            { label: 'Submitted', value: Object.values(submitted).filter(Boolean).length, emoji: '📤' },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #eee' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{stat.emoji}</div>
              <div style={{ fontSize: '26px', fontWeight: '700' }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>My Programmes</h2>

        {programmes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #eee', color: '#888', fontSize: '15px' }}>
            🏋️ No programmes yet — your coach will assign one soon!
          </div>
        ) : (
          programmes.map((programme) => {
            const acts = programme.activities || []
            const completed = getCompletedList(programme.id, acts)
            const isSubmitted = submitted[programme.id] || false

            return (
              <div key={programme.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', border: '1px solid #eee' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: '600' }}>{programme.name}</h3>
                  <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>📅 Due {programme.due_date || 'No due date'}</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>Progress</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75' }}>{completed.length} of {acts.length} activities</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: '#1D9E75', borderRadius: '3px', width: acts.length > 0 ? `${(completed.length / acts.length) * 100}%` : '0%', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                {acts.length === 0 ? (
                  <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '16px' }}>No activities added yet</div>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    {acts.map((activity, actIndex) => {
                      const key = `${programme.id}-${actIndex}`
                      const isUploading = uploadingVideos[key]
                      const videoUploaded = uploadedVideos[key]

                      return (
                        <div key={actIndex} style={{ padding: '14px', marginBottom: '8px', border: `1px solid ${isCompleted(programme.id, actIndex) ? '#1D9E75' : '#eee'}`, borderRadius: '12px', backgroundColor: isCompleted(programme.id, actIndex) ? '#f0fdf4' : 'white', transition: 'all 0.15s' }}>
                          <div onClick={() => !isSubmitted && toggleActivity(programme.id, actIndex)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: isSubmitted ? 'default' : 'pointer' }}>
                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: `2px solid ${isCompleted(programme.id, actIndex) ? '#1D9E75' : '#ddd'}`, backgroundColor: isCompleted(programme.id, actIndex) ? '#1D9E75' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isCompleted(programme.id, actIndex) && <span style={{ color: 'white', fontSize: '13px' }}>✓</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', fontSize: '14px' }}>{activity.name}</div>
                              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{activity.detail}</div>
                            </div>
                            {activity.requiresVideo && <span style={{ fontSize: '11px', backgroundColor: '#FAEEDA', color: '#854F0B', padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>📹 video required</span>}
                          </div>

                          {activity.requiresVideo && isCompleted(programme.id, actIndex) && !isSubmitted && (
                            <div style={{ marginTop: '12px', paddingLeft: '38px' }}>
                              {isUploading ? (
                                <div style={{ fontSize: '13px', color: '#1D9E75', fontWeight: '500' }}>⏳ Uploading video...</div>
                              ) : videoUploaded ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ fontSize: '13px', color: '#1D9E75', fontWeight: '500' }}>✅ {videoUploaded.name} uploaded!</div>
                                  <label htmlFor={`video-${key}`} style={{ fontSize: '12px', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}>Change</label>
                                  <input id={`video-${key}`} type="file" accept="video/*" capture="camcorder" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleVideoUpload(programme.id, actIndex, e.target.files[0]) }} />
                                </div>
                              ) : (
                                <div>
                                  <label htmlFor={`video-${key}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', backgroundColor: 'white', border: '1px solid #1D9E75', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#1D9E75', fontWeight: '500' }}>
                                    📹 Film or choose video
                                  </label>
                                  <input id={`video-${key}`} type="file" accept="video/*" capture="camcorder" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleVideoUpload(programme.id, actIndex, e.target.files[0]) }} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {!isSubmitted ? (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '6px' }}>Notes for your coach</label>
                      <textarea placeholder="How did the session go? Any questions for your coach..." value={notes[programme.id] || ''} onChange={(e) => setNotes({ ...notes, [programme.id]: e.target.value })} style={{ width: '100%', padding: '12px 14px', fontSize: '14px', borderRadius: '10px', border: '1px solid #eee', minHeight: '80px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <button onClick={() => handleSubmit(programme.id, acts)} style={{ padding: '11px 28px', backgroundColor: '#1D9E75', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Submit to coach →</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ padding: '16px 20px', backgroundColor: '#E1F5EE', border: '1px solid #1D9E75', borderRadius: '12px', marginBottom: submissionData[programme.id]?.coach_feedback ? '12px' : '0' }}>
                      <p style={{ color: '#0F6E56', fontWeight: '600', fontSize: '15px', margin: '0' }}>✅ Submitted to your coach!</p>
                      <p style={{ color: '#666', fontSize: '13px', marginTop: '6px' }}>Your coach will review your work and get back to you soon.</p>
                    </div>
                    {submissionData[programme.id]?.coach_feedback ? (
                      <div style={{ padding: '16px 20px', backgroundColor: '#F0F4FF', border: '1px solid #C7D2FE', borderRadius: '12px' }}>
                        <p style={{ color: '#3730A3', fontWeight: '600', fontSize: '13px', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💬 Coach feedback</p>
                        <p style={{ color: '#1e1b4b', fontSize: '14px', margin: '0', lineHeight: '1.6' }}>{submissionData[programme.id].coach_feedback}</p>
                      </div>
                    ) : (
                      <div style={{ padding: '12px 16px', backgroundColor: '#fafafa', border: '1px solid #eee', borderRadius: '12px', textAlign: 'center' }}>
                        <p style={{ color: '#aaa', fontSize: '13px', margin: '0' }}>⏳ Waiting for coach feedback...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default StudentDashboard