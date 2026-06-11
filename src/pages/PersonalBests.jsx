import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const commonExercises = [
  { name: 'Bench Press', unit: 'kg' },
  { name: 'Squat', unit: 'kg' },
  { name: 'Deadlift', unit: 'kg' },
  { name: 'Pull-ups', unit: 'reps' },
  { name: 'Push-ups', unit: 'reps' },
  { name: '5km Run', unit: 'min' },
  { name: '10km Run', unit: 'min' },
  { name: '100m Sprint', unit: 'sec' },
  { name: 'Plank Hold', unit: 'sec' },
  { name: 'Vertical Jump', unit: 'cm' },
]

function PersonalBests({ userId }) {
  const [bests, setBests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [exercise, setExercise] = useState('')
  const [customExercise, setCustomExercise] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('kg')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadBests() }, [])

  async function loadBests() {
    const { data } = await supabase
      .from('personal_bests')
      .select('*')
      .eq('student_id', userId)
      .order('achieved_at', { ascending: false })
    setBests(data || [])
    setLoading(false)
  }

  function selectExercise(ex) {
    if (ex === 'custom') {
      setExercise('custom')
    } else {
      const found = commonExercises.find(e => e.name === ex)
      setExercise(ex)
      setUnit(found?.unit || 'kg')
    }
  }

  async function savePB() {
    const finalName = exercise === 'custom' ? customExercise.trim() : exercise
    if (!finalName) { alert('Please choose or enter an exercise!'); return }
    if (!value || isNaN(parseFloat(value))) { alert('Please enter a valid number!'); return }

    setSaving(true)
    const { error } = await supabase.from('personal_bests').insert([{
      student_id: userId,
      exercise: finalName,
      value: parseFloat(value),
      unit,
      notes: notes.trim(),
    }])

    if (error) { alert('Error saving: ' + error.message); setSaving(false); return }

    resetForm()
    loadBests()
    setSaving(false)
  }

  async function deletePB(id) {
    if (!confirm('Delete this personal best?')) return
    await supabase.from('personal_bests').delete().eq('id', id)
    loadBests()
  }

  function resetForm() {
    setExercise(''); setCustomExercise(''); setValue(''); setUnit('kg'); setNotes(''); setShowAdd(false)
  }

  // Group bests by exercise name, keep only the best per exercise for the summary
  const groupedBests = {}
  bests.forEach(pb => {
    if (!groupedBests[pb.exercise]) groupedBests[pb.exercise] = []
    groupedBests[pb.exercise].push(pb)
  })

  function getBestValue(records, unit) {
    // For time-based units (min, sec), lower is better. For everything else, higher is better.
    const lowerIsBetter = ['min', 'sec'].includes(unit)
    return records.reduce((best, r) =>
      lowerIsBetter ? (r.value < best.value ? r : best) : (r.value > best.value ? r : best)
    , records[0])
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '13px' }}>Loading personal bests...</div>
  }

  return (
    <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '18px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>🏆 Personal Bests</div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ fontSize: '12px', color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
          {showAdd ? 'Cancel' : '+ Add PB'}
        </button>
      </div>

      {showAdd && (
        <div style={{ backgroundColor: '#0a0a0a', borderRadius: '14px', padding: '16px', border: '1px solid #1a1a1a', marginBottom: '14px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exercise</label>
            <select value={exercise} onChange={e => selectExercise(e.target.value)} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: exercise ? 'white' : '#555', fontSize: '13px', outline: 'none' }}>
              <option value="">Select exercise...</option>
              {commonExercises.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
              <option value="custom">✏️ Custom...</option>
            </select>
          </div>

          {exercise === 'custom' && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom exercise name</label>
              <input value={customExercise} onChange={e => setCustomExercise(e.target.value)} placeholder="e.g. Box Jump" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</label>
              <input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. 100" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '13px', outline: 'none' }}>
                {['kg', 'reps', 'min', 'sec', 'cm', 'm', 'km'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. felt strong, new equipment..." style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
          </div>

          <button onClick={savePB} disabled={saving} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            {saving ? 'Saving...' : '✓ Save PB'}
          </button>
        </div>
      )}

      {Object.keys(groupedBests).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 12px', color: '#555', fontSize: '13px' }}>
          No personal bests logged yet — tap + Add PB to start tracking!
        </div>
      ) : (
        Object.entries(groupedBests).map(([exerciseName, records]) => {
          const best = getBestValue(records, records[0].unit)
          const history = records.filter(r => r.id !== best.id).sort((a, b) => new Date(b.achieved_at) - new Date(a.achieved_at))

          return (
            <div key={exerciseName} style={{ backgroundColor: '#0a0a0a', borderRadius: '12px', padding: '14px', marginBottom: '8px', border: '1px solid #1a1a1a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{exerciseName}</div>
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                    {new Date(best.achieved_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {best.notes && ` · ${best.notes}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#1D9E75' }}>{best.value}{best.unit === 'reps' ? '' : best.unit}</div>
                    {best.unit === 'reps' && <div style={{ fontSize: '10px', color: '#555' }}>reps</div>}
                  </div>
                  <button onClick={() => deletePB(best.id)} style={{ background: 'none', border: 'none', color: '#444', fontSize: '14px', cursor: 'pointer', padding: '4px' }}>✕</button>
                </div>
              </div>

              {history.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1a1a1a' }}>
                  <div style={{ fontSize: '10px', color: '#444', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>History</div>
                  {history.slice(0, 3).map(h => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#555', padding: '4px 0' }}>
                      <span>{h.value}{h.unit === 'reps' ? ' reps' : h.unit} — {new Date(h.achieved_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                      <button onClick={() => deletePB(h.id)} style={{ background: 'none', border: 'none', color: '#333', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default PersonalBests