import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function SubmissionsPage({ onBack, userId }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('inbox')

  useEffect(() => {
    loadSubmissions()
  }, [])

  async function loadSubmissions() {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        programmes (
          name,
          student_email,
          activities
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading submissions:', error)
    } else {
      setSubmissions(data || [])
    }
    setLoading(false)
  }

  async function markReviewed(id) {
    const { error } = await supabase
      .from('submissions')
      .update({ reviewed: true })
      .eq('id', id)

    if (error) {
      alert('Error updating submission: ' + error.message)
      return
    }

    setSubmissions(submissions.map(s =>
      s.id === id ? { ...s, reviewed: true } : s
    ))
  }

  const inbox = submissions.filter(s => !s.reviewed)
  const completed = submissions.filter(s => s.reviewed)
  const showing = filter === 'inbox' ? inbox : completed

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '15px', color: '#888' }}>Loading submissions...</div>
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
                  <div style={{ fontWeight: '600', fontSize: '16px' }}>
                    {submission.programmes?.student_email || 'Unknown student'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>
                    📋 {submission.programmes?.name} · 📅 {new Date(submission.created_at).toLocaleDateString()}
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

              {submission.notes && (
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
              )}

              {submission.programmes?.activities && submission.completed_activities && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>
                    Activities completed:
                  </div>
                  {submission.programmes.activities.map((act, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      padding: '6px 0',
                      color: submission.completed_activities.includes(i) ? '#0F6E56' : '#aaa'
                    }}>
                      <span>{submission.completed_activities.includes(i) ? '✅' : '⬜'}</span>
                      <span>{act.name} — {act.detail}</span>
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