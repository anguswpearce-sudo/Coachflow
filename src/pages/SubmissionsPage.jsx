import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function SubmissionsPage({ onBack, userId }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('inbox')
  const [feedback, setFeedback] = useState({})
  const [sendingFeedback, setSendingFeedback] = useState({})

  useEffect(() => {
    loadSubmissions()
  }, [])

  async function loadSubmissions() {
    // First get all programme IDs that belong to this coach
    const { data: myProgrammes } = await supabase
      .from('programmes')
      .select('id')
      .eq('coach_id', userId)

    if (!myProgrammes || myProgrammes.length === 0) {
      setLoading(false)
      return
    }

    const programmeIds = myProgrammes.map(p => p.id)

    // Then get submissions for those programmes
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
      .in('programme_id', programmeIds)
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

  async function sendFeedback(submission) {
    const text = feedback[submission.id]
    if (!text?.trim()) {
      alert('Please write some feedback first!')
      return
    }

    setSendingFeedback({ ...sendingFeedback, [submission.id]: true })

    // Save feedback to the submission row
    const { error } = await supabase
      .from('submissions')
      .update({ coach_feedback: text, reviewed: true })
      .eq('id', submission.id)

    if (error) {
      alert('Error sending feedback: ' + error.message)
      setSendingFeedback({ ...sendingFeedback, [submission.id]: false })
      return
    }

    setSubmissions(submissions.map(s =>
      s.id === submission.id ? { ...s, coach_feedback: text, reviewed: true } : s
    ))
    setFeedback({ ...feedback, [submission.id]: '' })
    setSendingFeedback({ ...sendingFeedback, [submission.id]: false })
  }

  const inbox = submissions.filter(s => !s.reviewed)
  const reviewed = submissions.filter(s => s.reviewed)
  const showing = filter === 'inbox' ? inbox : reviewed

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '15px', color: '#888' }}>Loading submissions...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5' }}>

      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #eeeeee', padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          <span style={{ color: '#1D9E75' }}>coach</span>
          <span style={{ color: '#1a1a1a' }}>flow</span>
        </div>
        <button
          onClick={onBack}
          style={{ padding: '8px 18px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #eee', color: '#666', fontSize: '13px', fontWeight: '500', backgroundColor: 'white' }}
        >
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>Submissions</h1>
          <p style={{ color: '#888', marginTop: '4px', fontSize: '15px' }}>Review student work and leave feedback</p>
        </div>

        {/* Inbox / Reviewed tabs */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'white', border: '1px solid #eee', borderRadius: '12px', padding: '4px', marginBottom: '24px', width: 'fit-content' }}>
          {[
            { key: 'inbox', label: `📥 Inbox (${inbox.length})` },
            { key: 'reviewed', label: `✅ Reviewed (${reviewed.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '500', cursor: 'pointer', backgroundColor: filter === tab.key ? '#1D9E75' : 'transparent', color: filter === tab.key ? 'white' : '#666' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {showing.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #eee', color: '#888', fontSize: '15px' }}>
            {filter === 'inbox' ? '🎉 All caught up! No pending submissions.' : '📭 No reviewed submissions yet.'}
          </div>
        ) : (
          showing.map((submission) => (
            <div key={submission.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', border: '1px solid #eee' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '16px' }}>
                    {submission.programmes?.student_email || 'Unknown student'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>
                    📋 {submission.programmes?.name || 'Unknown programme'} · 📅 {new Date(submission.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', backgroundColor: submission.reviewed ? '#E1F5EE' : '#FAEEDA', color: submission.reviewed ? '#0F6E56' : '#854F0B' }}>
                  {submission.reviewed ? '✅ Reviewed' : '⏳ Pending'}
                </span>
              </div>

              {/* Student notes */}
              {submission.notes && (
                <div style={{ backgroundColor: '#F7F7F5', borderRadius: '10px', padding: '14px', fontSize: '14px', color: '#444', lineHeight: '1.6', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Student notes</div>
                  "{submission.notes}"
                </div>
              )}

              {/* Activities completed */}
              {submission.programmes?.activities && submission.completed_activities && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '10px' }}>
                    Activities — {submission.completed_activities.length} of {submission.programmes.activities.length} completed
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {submission.programmes.activities.map((act, i) => {
                      const done = submission.completed_activities.includes(i)
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', backgroundColor: done ? '#f0fdf4' : '#fafafa', border: `1px solid ${done ? '#bbf7d0' : '#eee'}` }}>
                          <span style={{ fontSize: '16px' }}>{done ? '✅' : '⬜'}</span>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: done ? '#0F6E56' : '#aaa' }}>{act.name}</div>
                            <div style={{ fontSize: '12px', color: '#aaa' }}>{act.detail}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Existing coach feedback */}
              {submission.coach_feedback && (
                <div style={{ backgroundColor: '#E1F5EE', borderRadius: '10px', padding: '14px', fontSize: '14px', color: '#0F6E56', lineHeight: '1.6', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Your feedback</div>
                  {submission.coach_feedback}
                </div>
              )}

              {/* Leave feedback + mark reviewed */}
              {!submission.reviewed && (
                <div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '6px' }}>Leave feedback for student</label>
                    <textarea
                      placeholder="Great work! Here's what I noticed..."
                      value={feedback[submission.id] || ''}
                      onChange={(e) => setFeedback({ ...feedback, [submission.id]: e.target.value })}
                      style={{ width: '100%', padding: '12px 14px', fontSize: '14px', borderRadius: '10px', border: '1px solid #eee', minHeight: '80px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => sendFeedback(submission)}
                      disabled={sendingFeedback[submission.id]}
                      style={{ padding: '10px 24px', backgroundColor: '#1D9E75', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                    >
                      {sendingFeedback[submission.id] ? 'Sending...' : '💬 Send feedback'}
                    </button>
                    <button
                      onClick={() => markReviewed(submission.id)}
                      style={{ padding: '10px 24px', cursor: 'pointer', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px', fontWeight: '500', backgroundColor: 'white', color: '#666' }}
                    >
                      Mark reviewed (no feedback)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SubmissionsPage