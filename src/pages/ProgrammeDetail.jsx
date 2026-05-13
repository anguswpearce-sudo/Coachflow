import { useState } from 'react'

function ProgrammeDetail({ programme, onBack }) {
  const [feedback, setFeedback] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)

  const activities = programme.activities || []
  const submission = programme.submission || null

  function handleFeedback() {
    if (feedback === '') {
      alert('Please write some feedback first!')
      return
    }
    setFeedbackSent(true)
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
        <button
          onClick={onBack}
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
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            {programme.name}
          </h1>
          <p style={{ color: '#888', marginTop: '4px', fontSize: '15px' }}>
            👤 {programme.student} · 📅 Due {programme.due || 'No due date set'}
          </p>
        </div>

        {/* Submission status */}
        <div style={{
          backgroundColor: submission ? '#E1F5EE' : '#FFF8E1',
          border: `1px solid ${submission ? '#1D9E75' : '#FFB300'}`,
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ fontSize: '24px' }}>
            {submission ? '✅' : '⏳'}
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px', color: submission ? '#0F6E56' : '#854F0B' }}>
              {submission ? 'Submitted' : 'Not yet submitted'}
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
              {submission ? `Submitted on ${submission.date}` : 'Waiting for student to complete and submit'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

          {/* Activities */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #eee'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
              Activities {activities.length === 0 && <span style={{ color: '#bbb', fontWeight: '400', fontSize: '14px' }}>(none added yet)</span>}
            </h2>
            {activities.length === 0 ? (
              <div style={{ fontSize: '14px', color: '#aaa' }}>
                No activities in this programme yet
              </div>
            ) : (
              activities.map((activity, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom: i < activities.length - 1 ? '1px solid #f5f5f5' : 'none'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #1D9E75',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#1D9E75',
                    flexShrink: 0
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{activity.name}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{activity.detail}</div>
                  </div>
                  {activity.requiresVideo && (
                    <span style={{
                      fontSize: '11px',
                      backgroundColor: '#FAEEDA',
                      color: '#854F0B',
                      padding: '2px 8px',
                      borderRadius: '20px'
                    }}>
                      📹 video
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Student notes */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #eee'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Student notes</h2>
            {submission ? (
              <div>
                <div style={{
                  backgroundColor: '#F7F7F5',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '14px',
                  color: '#444',
                  lineHeight: '1.6',
                  marginBottom: '16px'
                }}>
                  "{submission.notes}"
                </div>

                {submission.videos && submission.videos.length > 0 && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>
                      📹 Video submissions
                    </div>
                    {submission.videos.map((video, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: '#F7F7F5',
                        borderRadius: '8px',
                        marginBottom: '6px',
                        fontSize: '13px'
                      }}>
                        <span>📹 {video}</span>
                        <button style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          border: '1px solid #eee',
                          backgroundColor: 'white'
                        }}>
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: '#888' }}>
                No notes yet — student hasn't submitted
              </div>
            )}
          </div>
        </div>

        {/* Feedback */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #eee'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            Leave feedback for {programme.student}
          </h2>

          {feedbackSent ? (
            <div style={{
              padding: '16px',
              backgroundColor: '#E1F5EE',
              borderRadius: '10px',
              color: '#0F6E56',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ✅ Feedback sent to {programme.student}!
            </div>
          ) : (
            <div>
              <textarea
                placeholder={`Write your feedback for ${programme.student}...`}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #eee',
                  borderRadius: '10px',
                  fontSize: '14px',
                  minHeight: '100px',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              <button
                onClick={handleFeedback}
                style={{
                  marginTop: '12px',
                  padding: '10px 24px',
                  backgroundColor: '#1D9E75',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Send feedback →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProgrammeDetail