import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function StudentsPage({ onBack, userId }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { loadStudents() }, [])

  async function loadStudents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('coach_students')
      .select('*')
      .eq('coach_id', userId)
      .order('created_at', { ascending: false })

    if (error) { console.error('Error loading students:', error) }
    else {
      const enriched = await Promise.all((data || []).map(async (row) => {
        if (row.student_id) {
          const { data: profile } = await supabase.from('profiles').select('email').eq('id', row.student_id).single()
          const { data: sp } = await supabase.from('student_profiles').select('*').eq('id', row.student_id).single()
          return { ...row, email: profile?.email || row.student_email, name: sp?.name || null, location: sp?.location || null, age: sp?.age || null, level: sp?.level || null }
        }
        return { ...row, email: row.student_email }
      }))
      setStudents(enriched)
    }
    setLoading(false)
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) { alert('Please enter a student email!'); return }
    const already = students.find(s => s.student_email === inviteEmail.trim().toLowerCase())
    if (already) { alert('You have already invited this student!'); return }
    setSending(true)
    const { data: existingProfile } = await supabase.from('profiles').select('id').eq('email', inviteEmail.trim().toLowerCase()).single()
    const { error } = await supabase.from('coach_students').insert([{
      coach_id: userId,
      student_email: inviteEmail.trim().toLowerCase(),
      student_id: existingProfile?.id || null,
      status: 'pending'
    }])
    if (error) { alert('Error sending invite: ' + error.message); setSending(false); return }
    setInviteEmail(''); setShowAddForm(false); setSending(false)
    loadStudents()
  }

  async function removeStudent(id) {
    if (!confirm('Remove this student?')) return
    await supabase.from('coach_students').delete().eq('id', id)
    loadStudents()
  }

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
  })

  const accepted = filtered.filter(s => s.status === 'accepted')
  const pending = filtered.filter(s => s.status === 'pending')

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <div style={{ padding: '56px 20px 16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Students</div>
          <div style={{ fontSize: '14px', color: '#555', marginTop: '2px' }}>{accepted.length} active · {pending.length} pending</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            + Add
          </button>
          <button onClick={onBack} style={{ padding: '10px 14px', background: '#111', border: '1px solid #222', borderRadius: '12px', color: '#555', fontSize: '13px', cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px 24px 20px' }}>

        {/* Add form */}
        {showAddForm && (
          <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1a1a1a', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Invite a student</div>
            <div style={{ fontSize: '12px', color: '#555', marginBottom: '14px' }}>They'll get a notification to accept or decline.</div>
            <input
              type="email"
              placeholder="student@email.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendInvite()}
              style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit', marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={sendInvite} disabled={sending} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                {sending ? 'Sending...' : 'Send invite'}
              </button>
              <button onClick={() => { setShowAddForm(false); setInviteEmail('') }} style={{ padding: '12px 16px', backgroundColor: 'transparent', border: '1px solid #222', borderRadius: '10px', color: '#555', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 14px 12px 40px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>Loading...</div>
        ) : students.length === 0 ? (
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>No students yet</div>
            <div style={{ fontSize: '13px', color: '#555' }}>Tap + Add to invite your first student</div>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Pending invites</div>
                {pending.map(student => (
                  <div key={student.id} style={{ backgroundColor: '#111', borderRadius: '14px', padding: '16px 18px', marginBottom: '8px', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#444' }}>?</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#aaa' }}>{student.student_email}</div>
                        <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>Waiting for response</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600', backgroundColor: 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(245,158,11,0.2)' }}>⏳ Pending</span>
                      <button onClick={() => removeStudent(student.id)} style={{ padding: '5px 10px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #cc000033', backgroundColor: 'rgba(204,0,0,0.1)', color: '#cc0000' }}>Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {accepted.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Active students</div>
                {accepted.map(student => (
                  <div key={student.id} style={{ backgroundColor: '#111', borderRadius: '14px', padding: '16px 18px', marginBottom: '8px', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: 'white', fontWeight: '700' }}>
                        {(student.name || student.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{student.name || student.email}</div>
                        <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                          {student.location && `📍 ${student.location} · `}
                          {student.age && `Age ${student.age} · `}
                          {student.level && `💪 ${student.level}`}
                          {!student.location && !student.age && !student.level && student.name && student.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '600', backgroundColor: 'rgba(29,158,117,0.1)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(29,158,117,0.2)' }}>✅ Active</span>
                      <button onClick={() => removeStudent(student.id)} style={{ padding: '5px 10px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #cc000033', backgroundColor: 'rgba(204,0,0,0.1)', color: '#cc0000' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filtered.length === 0 && search && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#555', fontSize: '14px' }}>No students match "{search}"</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default StudentsPage