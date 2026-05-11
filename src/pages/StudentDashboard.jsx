import { useState } from 'react'
import { supabase } from '../supabase'
import StudentProfile from './StudentProfile'

function StudentDashboard({ onSignOut, userId }) {
  const [programmes] = useState([
    {
      name: 'Upper body strength — week 1',
      coach: 'Coach Sarah',
      due: '15 May 2026',
      activities: [
        { name: 'Push-ups', detail: '3 sets x 15 reps', requiresVideo: true },
        { name: 'Dumbbell rows', detail: '3 sets x 12 reps', requiresVideo: true },
        { name: 'Plank hold', detail: '3 x 45 seconds', requiresVideo: false },
      ]
    }
  ])

  const [completedActivities, setCompletedActivities] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notes, setNotes] = useState('')
  const [uploadedVideos, setUploadedVideos] = useState({})

  function toggleActivity(progIndex, actIndex) {
    const key = `${progIndex}-${actIndex}`
    if (completedActivities.includes(key)) {
      setCompletedActivities(completedActivities.filter(k => k !== key))
    } else {
      setCompletedActivities([...completedActivities, key])
    }
  }

  function isCompleted(progIndex, actIndex) {
    return completedActivities.includes(`${progIndex}-${actIndex}`)
  }

  function handleVideoUpload(progIndex, actIndex, file) {
    const key = `${progIndex}-${actIndex}`
    setUploadedVideos({ ...uploadedVideos, [key]: file.name })
  }

  async function handleSubmit() {
    if (completedActivities.length === 0) {
      alert('Please tick off at least one activity before submitting!')
      return
    }
    setSubmitted(true)
  }

  if (showProfile) {
    return <StudentProfile userId={userId} onBack={() => setShowProfile(false)} />
  }

  return (
    <div style={{ padding: '40px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Student Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowProfile(true)}
            style={{
              padding: '8px 20px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid #1D9E75',
              color: '#1D9E75',
              fontSize: '14px'
            }}
          >
            My profile
          </button>
          <button
            onClick={onSignOut}
            style={{
              padding: '8px 20px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <p>Welcome back, Student!</p>

      <div style={{ marginTop: '30px' }}>
        <h2>My Programmes</h2>

        {programmes.map((programme, progIndex) => (
          <div key={progIndex} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '15px',
            maxWidth: '600px'
          }}>
            <h3>{programme.name}</h3>
            <p style={{ color: '#666' }}>From: {programme.coach} · Due: {programme.due}</p>

            <div style={{ marginTop: '15px' }}>
              <h4>Activities</h4>

              {programme.activities.map((activity, actIndex) => (
                <div
                  key={actIndex}
                  style={{
                    padding: '12px',
                    marginTop: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: isCompleted(progIndex, actIndex) ? '#f0fdf4' : 'white',
                  }}
                >
                  <div
                    onClick={() => !submitted && toggleActivity(progIndex, actIndex)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: submitted ? 'default' : 'pointer',
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: '2px solid #1D9E75',
                      backgroundColor: isCompleted(progIndex, actIndex) ? '#1D9E75' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isCompleted(progIndex, actIndex) && (
                        <span style={{ color: 'white', fontSize: '14px' }}>✓</span>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{activity.name}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>{activity.detail}</div>
                    </div>

                    {activity.requiresVideo && (
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: '#FAEEDA',
                        color: '#854F0B',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        📹 video required
                      </span>
                    )}
                  </div>

                  {activity.requiresVideo && isCompleted(progIndex, actIndex) && !submitted && (
                    <div style={{ marginTop: '10px', paddingLeft: '36px' }}>
                      <label
                        htmlFor={`video-${progIndex}-${actIndex}`}
                        style={{
                          display: 'inline-block',
                          padding: '6px 16px',
                          backgroundColor: 'white',
                          border: '1px solid #1D9E75',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#1D9E75'
                        }}
                      >
                        📹 Film or choose video
                      </label>
                      <input
                        id={`video-${progIndex}-${actIndex}`}
                        type="file"
                        accept="video/*"
                        capture="camcorder"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handleVideoUpload(progIndex, actIndex, e.target.files[0])
                          }
                        }}
                      />
                      {uploadedVideos[`${progIndex}-${actIndex}`] && (
                        <p style={{
                          marginTop: '6px',
                          fontSize: '12px',
                          color: '#1D9E75'
                        }}>
                          ✅ {uploadedVideos[`${progIndex}-${actIndex}`]} ready to submit
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '13px', color: '#666' }}>
                {completedActivities.filter(k => k.startsWith(`${progIndex}-`)).length} of {programme.activities.length} activities completed
              </p>

              {!submitted ? (
                <div>
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500' }}>
                      Notes for your coach
                    </label>
                    <br />
                    <textarea
                      placeholder="How did the session go? Any questions for your coach..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{
                        marginTop: '6px',
                        width: '100%',
                        padding: '10px',
                        fontSize: '14px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        minHeight: '80px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    style={{
                      marginTop: '12px',
                      padding: '10px 25px',
                      backgroundColor: '#1D9E75',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Submit to coach
                  </button>
                </div>
              ) : (
                <div style={{
                  marginTop: '15px',
                  padding: '16px 20px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #1D9E75',
                  borderRadius: '8px',
                }}>
                  <p style={{
                    color: '#1D9E75',
                    fontWeight: '500',
                    fontSize: '15px',
                    margin: '0'
                  }}>
                    ✅ Submitted to Coach Sarah!
                  </p>
                  <p style={{
                    color: '#666',
                    fontSize: '13px',
                    marginTop: '6px'
                  }}>
                    Your coach will review your work and get back to you soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StudentDashboard