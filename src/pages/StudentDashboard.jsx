import { useState } from 'react'
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

  function handleSubmit() {
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
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5' }}>

      {/* Navbar */}
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

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            My Training
          </h1>
          <p style={{ color: '#888', marginTop: '4px', fontSize: '15px' }}>
            Complete your programmes and submit to your coach
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Programmes', value: programmes.length, emoji: '📋' },
            { label: 'Activities done', value: completedActivities.length, emoji: '✅' },
            { label: 'Submitted', value: submitted ? '1' : '0', emoji: '📤' },
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

        {programmes.map((programme, progIndex) => (
          <div key={progIndex} style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '16px',
            border: '1px solid #eee',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600' }}>{programme.name}</h3>
              <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
                👤 {programme.coach} · 📅 Due {programme.due}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>Progress</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75' }}>
                  {completedActivities.filter(k => k.startsWith(`${progIndex}-`)).length} of {programme.activities.length} activities
                </span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  backgroundColor: '#1D9E75',
                  borderRadius: '3px',
                  width: `${(completedActivities.filter(k => k.startsWith(`${progIndex}-`)).length / programme.activities.length) * 100}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Activities */}
            <div style={{ marginBottom: '20px' }}>
              {programme.activities.map((activity, actIndex) => (
                <div
                  key={actIndex}
                  style={{
                    padding: '14px',
                    marginBottom: '8px',
                    border: `1px solid ${isCompleted(progIndex, actIndex) ? '#1D9E75' : '#eee'}`,
                    borderRadius: '12px',
                    backgroundColor: isCompleted(progIndex, actIndex) ? '#f0fdf4' : 'white',
                    transition: 'all 0.15s'
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
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      border: `2px solid ${isCompleted(progIndex, actIndex) ? '#1D9E75' : '#ddd'}`,
                      backgroundColor: isCompleted(progIndex, actIndex) ? '#1D9E75' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s'
                    }}>
                      {isCompleted(progIndex, actIndex) && (
                        <span style={{ color: 'white', fontSize: '13px' }}>✓</span>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{activity.name}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{activity.detail}</div>
                    </div>

                    {activity.requiresVideo && (
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: '#FAEEDA',
                        color: '#854F0B',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontWeight: '500'
                      }}>
                        📹 video required
                      </span>
                    )}
                  </div>

                  {activity.requiresVideo && isCompleted(progIndex, actIndex) && !submitted && (
                    <div style={{ marginTop: '12px', paddingLeft: '38px' }}>
                      <label
                        htmlFor={`video-${progIndex}-${actIndex}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 16px',
                          backgroundColor: 'white',
                          border: '1px solid #1D9E75',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#1D9E75',
                          fontWeight: '500'
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
                        <p style={{ marginTop: '6px', fontSize: '12px', color: '#1D9E75' }}>
                          ✅ {uploadedVideos[`${progIndex}-${actIndex}`]} ready to submit
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!submitted ? (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '6px' }}>
                    Notes for your coach
                  </label>
                  <textarea
                    placeholder="How did the session go? Any questions for your coach..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      border: '1px solid #eee',
                      minHeight: '80px',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  style={{
                    padding: '11px 28px',
                    backgroundColor: '#1D9E75',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Submit to coach →
                </button>
              </div>
            ) : (
              <div style={{
                padding: '16px 20px',
                backgroundColor: '#E1F5EE',
                border: '1px solid #1D9E75',
                borderRadius: '12px',
              }}>
                <p style={{ color: '#0F6E56', fontWeight: '600', fontSize: '15px', margin: '0' }}>
                  ✅ Submitted to {programme.coach}!
                </p>
                <p style={{ color: '#666', fontSize: '13px', marginTop: '6px' }}>
                  Your coach will review your work and get back to you soon.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default StudentDashboard