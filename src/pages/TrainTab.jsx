import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function TrainTab({ userId, role }) {
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProg, setSelectedProg] = useState(null)
  const [completedActivities, setCompletedActivities] = useState({})
  const [submitted, setSubmitted] = useState({})
  const [notes, setNotes] = useState({})

  useEffect(() => { loadProgrammes() }, [userId])

  async function loadProgrammes() {
    setLoading(true)
    if (role === 'coach') {
      const { data } = await supabase.from('programmes').select('*').eq('coach_id', userId).order('created_at', { ascending: false })
      setProgrammes(data || [])
    } else {
      const { data: prof } = await supabase.from('profiles').select('email').eq('id', userId).single()
      if (prof) {
        const { data } = await supabase.from('programmes').select('*').eq('student_email', prof.email)
        setProgrammes(data || [])
      }
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

  async function handleSubmit(progId) {
    const completed = completedActivities[progId] || []
    if (completed.length === 0) { alert('Tick off at least one activity first!'); return }
    const { error } = await supabase.from('submissions').insert([{ programme_id: progId, student_id: userId, notes: notes[progId] || '', completed_activities: completed }])
    if (error) { alert('Error: ' + error.message); return }
    setSubmitted({ ...submitted, [progId]: true })
  }

  if (selectedProg) {
    const acts = selectedProg.activities || []
    const completed = completedActivities[selectedProg.id] || []
    const isSubmitted = submitted[selectedProg.id] || false
    const progress = acts.length > 0 ? Math.round((completed.length / acts.length) * 100) : 0

    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
        <div style={{ padding: '56px 20px 20px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSelectedProg(null)} style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
        </div>

        <div style={{ padding: '0 20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{selectedProg.name}</div>
            <div style={{ fontSize: '13px', color: '#555' }}>📅 Due {selectedProg.due_date || 'No date set'}</div>
          </div>

          {/* Progress bar */}
          <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '16px', marginBottom: '16px', border: '1px solid #1a1a1a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#aaa' }}>Progress</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1D9E75' }}>{progress}%</span>
            </div>
            <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: '#1D9E75', borderRadius: '3px', width: `${progress}%`, transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '8px' }}>{completed.length} of {acts.length} activities done</div>
          </div>

          {/* Activities */}
          {acts.map((act, i) => {
            const isDone = (completedActivities[selectedProg.id] || []).includes(i)
            return (
              <div
                key={i}
                onClick={() => !isSubmitted && toggleActivity(selectedProg.id, i)}
                style={{
                  backgroundColor: isDone ? 'rgba(29,158,117,0.1)' : '#111',
                  border: `1px solid ${isDone ? 'rgba(29,158,117,0.4)' : '#1a1a1a'}`,
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '10px',
                  cursor: isSubmitted ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  border: `2px solid ${isDone ? '#1D9E75' : '#333'}`,
                  backgroundColor: isDone ? '#1D9E75' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: '13px', color: 'white'
                }}>
                  {isDone && '✓'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: isDone ? '#1D9E75' : 'white' }}>{act.name}</div>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{act.detail}</div>
                </div>
                {act.requiresVideo && <span style={{ fontSize: '10px', backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '3px 8px', borderRadius: '20px', fontWeight: '600', border: '1px solid rgba(245,158,11,0.3)' }}>📹 VIDEO</span>}
              </div>
            )
          })}

          {/* Submit section (students only) */}
          {role === 'student' && !isSubmitted && (
            <div style={{ marginTop: '20px' }}>
              <textarea
                placeholder="Notes for your coach..."
                value={notes[selectedProg.id] || ''}
                onChange={(e) => setNotes({ ...notes, [selectedProg.id]: e.target.value })}
                style={{ width: '100%', padding: '14px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '14px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', minHeight: '80px', fontFamily: 'inherit', marginBottom: '12px' }}
              />
              <button
                onClick={() => handleSubmit(selectedProg.id)}
                style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
              >
                Submit to Coach →
              </button>
            </div>
          )}

          {isSubmitted && (
            <div style={{ backgroundColor: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '14px', padding: '20px', textAlign: 'center', marginTop: '20px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1D9E75' }}>Submitted!</div>
              <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>Your coach will review and get back to you</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <div style={{ padding: '56px 20px 20px 20px' }}>
        <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '4px' }}>Train</div>
        <div style={{ fontSize: '14px', color: '#555' }}>{role === 'coach' ? 'Your programmes' : 'Your training'}</div>
      </div>

      <div style={{ padding: '0 20px 24px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>Loading...</div>
        ) : programmes.length === 0 ? (
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏋️</div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>No programmes yet</div>
            <div style={{ fontSize: '13px', color: '#555' }}>{role === 'coach' ? 'Create one from your dashboard' : 'Your coach will assign one soon'}</div>
          </div>
        ) : (
          programmes.map((prog, i) => {
            const acts = prog.activities || []
            const completed = completedActivities[prog.id] || []
            const progress = acts.length > 0 ? Math.round((completed.length / acts.length) * 100) : 0
            return (
              <div
                key={i}
                onClick={() => setSelectedProg(prog)}
                style={{ backgroundColor: '#111', borderRadius: '20px', padding: '20px', marginBottom: '12px', border: '1px solid #1a1a1a', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{prog.name}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>
                      {role === 'coach' ? `👤 ${prog.student_email}` : `📅 Due ${prog.due_date || 'No date'}`}
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1D9E75' }}>{progress}%</span>
                </div>
                <div style={{ height: '4px', backgroundColor: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#1D9E75', borderRadius: '2px', width: `${progress}%` }} />
                </div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '8px' }}>{acts.length} activities</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TrainTab