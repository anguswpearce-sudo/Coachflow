import { useState } from 'react'

const initialSubmissions = [
  {
    id: 1,
    student: 'Jamie Chen',
    programme: 'Upper body strength — week 1',
    date: '10 May 2026',
    notes: 'Felt really strong today! Push-ups were tough on the last set but got through them all.',
    videos: ['pushups_video.mp4', 'rows_video.mp4'],
    reviewed: false,
  },
  {
    id: 2,
    student: 'Sam Patel',
    programme: 'Mobility & flexibility circuit',
    date: '9 May 2026',
    notes: 'All done! The hip flexor stretch was really challenging.',
    videos: ['mobility_video.mp4'],
    reviewed: false,
  },
]

function SubmissionsPage({ onBack }) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [filter, setFilter] = useState('inbox')

  function markReviewed(id) {
    setSubmissions(submissions.map(s =>
      s.id === id ? { ...s, reviewed: true } : s
    ))
  }

  const inbox = submissions.filter(s => !s.reviewed)
  const completed = submissions.filter(s => s.reviewed)
  const showing = filter === 'inbox' ? inbox : completed

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

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>Submissions</h1>
          <p style={{ color: '#888', marginTop: '4px', fontSize: '15px' }}>
            Review student work and leave feedback
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: 'white',
          border: '1px solid #eee',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
          width: 'fit-content'
        }}>
          {[
            { key: 'inbox', label: `📥 Inbox (${inbox.length})` },
            { key: 'completed', label: `✅ Reviewed (${completed.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                backgroundColor: filter === tab.key ? '#1D9E75' : 'transparent',
                color: filter === tab.key ? 'white' : '#666',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Submissions list */}
        {showing.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #eee',
            color: '#888',
            fontSize: '15px'
          }}>
            {filter === 'inbox' ? '🎉 All caught up! No pending submissions.' : 'No reviewed submissions yet.'}
          </div>
        ) : (
          showing.map((submission) => (
            <div key={submission.id} style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '16px',
              border: '1px solid #eee',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '16px' }}>{submission.student}</div>
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>
                    📋 {submission.programme} · 📅 {submission.date}
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: submission.reviewed ? '#E1F5EE' : '#FAEEDA',
                  color: submission.reviewed ? '#0F6E56' : '#854F0B'
                }}>
                  {submission.reviewed ? '✅ Reviewed' : '⏳ Pending review'}
                </span>
              </div>

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

              {submission.videos.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
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

              {!submission.reviewed && (
                <button
                  onClick={() => markReviewed(submission.id)}
                  style={{
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
                  ✅ Mark as reviewed
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SubmissionsPage