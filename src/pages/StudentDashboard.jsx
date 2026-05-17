import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import StudentProfile from './StudentProfile'

function StudentDashboard({ onSignOut, userId }) {
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [completedActivities, setCompletedActivities] = useState({})
  const [submitted, setSubmitted] = useState({})
  const [showProfile, setShowProfile] = useState(false)
  const [notes, setNotes] = useState({})
  const [uploadedVideos, setUploadedVideos] = useState({})

  useEffect(() => {
    loadProgrammes()
  }, [userId])

  async function loadProgrammes() {
    setLoading(true)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Could not load profile', profileError)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('programmes')
      .select('*')
      .eq('student_email', profile.email)

    if (error) {
      console.error('Error loading programmes:', error)
    } else {
      setProgrammes(data || [])
    }
    setLoading(false)
  }

  function toggleActivity(progId, actIndex) {
    const current = completedActivities[progId] || []
    if (current.includes(actIndex)) {
      setCompletedActivities({ ...completedActivities, [progId]: current.filter(i => i !== actIndex) })
    } else {
      setCompletedActivities({ ...completedActivities, [progId]: [...current, actIndex] })
    }
  }

  function isCompleted(progId, actIndex) {
    return (completedActivities[progId] || []).includes(actIndex)
  }

  function handleVideoUpload(progId, actIndex, file) {
    setUploadedVideos({ ...uploadedVideos, [`${progId}-${actIndex}`]: file.name })
  }

  async function handleSubmit(progId) {
    const completed = completedActivities[progId] || []
    if (completed.length === 0) {
      alert('Please tick off at least one activity before submitting!')
      return
    }
    const { error } = await supabase
      .from('submissions')
      .insert([{
        programme_id: progId,
        student_id: userId,
        notes: notes[progId] || '',
        completed_activities: completed,
      }])
    if (error) {
      alert('Error submitting: ' + error.message)
      return
    }
    setSubmitted({ ...submitted, [progId]: true })
  }

  if (showProfile) {
    return <StudentProfile userId={userId} onBack={() => setShowProfile(false)} />
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '15px', color: '#888' }}>Loading your programmes...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5' }}>

      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #eeeeee',
        padding: '0 32px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          <span style={{ color: '#1D9E75' }}>coach</span>
          <span style={{ color: '#1a1a1a' }}>flow</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowProfile(true)}
            style={{
              padding: '8px 18px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid #1D9E75',
              color: '#1D9E75',
              fontSize: '13px',
              fontWeight: '500',
              backgroundColor: 'white'
            }}
          >
            My profile
          </button>
          <button
            onClick={onSignOut}
            style={{
              padding: '8px 18px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid #eee',
              color: '#666',
              fontSize: '13px',
              fontWeight: '500',
              backgroundColor: 'white'
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>My Training</h1>
          <p style={{ color: '#888', marginTop: '4px', fontSize: '15px' }}>
            Complete your programmes and submit to your coach
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Programmes', value: programmes.length, emoji: '📋' },
            { label: 'Activities done', value: Object.values(completedActivities).flat().length, emoji: '✅' },
            { label: 'Submitted', value: Object.values(submitted).filter(Boolean).length, emoji: '📤' },
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: 'white',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid #eee',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{stat.emoji}</div>
              <div style={{ fontSize: '26px', fontWeight: '700' }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>My Programmes</h2>

        {programmes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #eee',
            color: '#888',
            fontSize: '15px'
          }}>
            🏋️ No programmes yet — your coach will assign one soon!
          </div>
        ) : (
          programmes.map((programme) => {
            const acts = programme.activities || []
            const completed = completedActivities[programme.id] || []
            const isSubmitted = submitted[programme.id] || false

            return (
              <div key={programme.id} style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '16px',
                border: '1px solid #eee',
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: '600' }}>{programme.name}</h3>
                  <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
                    📅 Due {programme.due_date || 'No due date'}
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>Progress</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75' }}>
                      {completed.length} of {acts.length} activities
                    </span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      backgroundColor: '#1D9E75',
                      borderRadius: '3px',
                      width: acts.length > 0 ? `${(completed.length / acts.length) * 100}%` : '0%',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {acts.length === 0 ? (
                  <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '16px' }}>
                    No activities added yet
                  </div>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    {acts.map((activity, actIndex) => (
                      <div key={actIndex} style={{
                        padding: '14px',
                        marginBottom: '8px',
                        border: `1px solid ${isCompleted(programme.id, actIndex) ? '#1D9E75' : '#eee'}`,
                        borderRadius: '12px',
                        backgroundColor: isCompleted(programme.id, actIndex) ? '#f0fdf4' : 'white',
                        transition: 'all 0.15s'
                      }}>
                        <div
                          onClick={() => !isSubmitted && toggleActivity(programme.id, actIndex)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: isSubmitted ? 'default' : 'pointer' }}
                        >
                          <div style={{
                            width: '26px', height: '26px', borderRadius: '50%',
                            border: `2px solid ${isCompleted(programme.id, actIndex) ? '#1D9E75' : '#ddd'}`,
                            backgroundColor: isCompleted(programme.id, actIndex) ? '#1D9E75' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, transition: 'all 0.15s'
                          }}>
                            {isCompleted(programme.id, actIndex) && (
                              <span style={{ color: 'white', fontSize: '13px' }}>✓</span>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', fontSize: '14px' }}>{activity.name}</div>
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{activity.detail}</div>
                          </div>
                          {activity.requiresVideo && (
                            <span style={{
                              fontSize: '11px', backgroundColor: '#FAEEDA', color: '#854F0B',
                              padding: '3px 10px', borderRadius: '20px', fontWeight: '500'
                            }}>
                              📹 video required
                            </span>
                          )}
                        </div>

                        {activity.requiresVideo && isCompleted(programme.id, actIndex) && !isSubmitted && (
                          <div style={{ marginTop: '12px', paddingLeft: '38px' }}>
                            <label
                              htmlFor={`video-${programme.id}-${actIndex}`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '7px 16px', backgroundColor: 'white',
                                border: '1px solid #1D9E75', borderRadius: '8px',
                                cursor: 'pointer', fontSize: '13px', color: '#1D9E75', fontWeight: '500'
                              }}
                            >
                              📹 Film or choose video
                            </label>
                            <input
                              id={`video-${programme.id}-${actIndex}`}
                              type="file" accept="video/*" capture="camcorder"
                              style={{ display: 'none' }}
                              onChange={(e) => { if (e.target.files[0]) handleVideoUpload(programme.id, actIndex, e.target.files[0]) }}
                            />
                            {uploadedVideos[`${programme.id}-${actIndex}`] && (
                              <p style={{ marginTop: '6px', fontSize: '12px', color: '#1D9E75' }}>
                                ✅ {uploadedVideos[`${programme.id}-${actIndex}`]} ready to submit
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!isSubmitted ? (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '6px' }}>
                        Notes for your coach
                      </label>
                      <textarea
                        placeholder="How did the session go? Any questions for your coach..."
                        value={notes[programme.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [programme.id]: e.target.value })}
                        style={{
                          width: '100%', padding: '12px 14px', fontSize: '14px',
                          borderRadius: '10px', border: '1px solid #eee',
                          minHeight: '80px', resize: 'vertical', outline: 'none',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleSubmit(programme.id)}
                      style={{
                        padding: '11px 28px', backgroundColor: '#1D9E75',
                        color: 'white', border: 'none', borderRadius: '10px',
                        cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                      }}
                    >
                      Submit to coach →
                    </button>
                  </div>
                ) : (
                  <div style={{
                    padding: '16px 20px', backgroundColor: '#E1F5EE',
                    border: '1px solid #1D9E75', borderRadius: '12px',
                  }}>
                    <p style={{ color: '#0F6E56', fontWeight: '600', fontSize: '15px', margin: '0' }}>
                      ✅ Submitted to your coach!
                    </p>
                    <p style={{ color: '#666', fontSize: '13px', marginTop: '6px' }}>
                      Your coach will review your work and get back to you soon.
                    </p>
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