import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function StudentsPage({ onBack, userId }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    setLoading(true)

    const { data, error } = await supabase
      .from('coach_students')
      .select('*')
      .eq('coach_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading students:', error)
    } else {
      const enriched = await Promise.all((data || []).map(async (row) => {
        if (row.student_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', row.student_id)
            .single()

          const { data: studentProfile } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('id', row.student_id)
            .single()

          return {
            ...row,
            email: profile?.email || row.student_email,
            name: studentProfile?.name || null,
            location: studentProfile?.location || null,
            age: studentProfile?.age || null,
            level: studentProfile?.level || null,
          }
        }
        return { ...row, email: row.student_email }
      }))

      setStudents(enriched)
    }
    setLoading(false)
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) {
      alert('Please enter a student email!')
      return
    }

    const already = students.find(s => s.student_email === inviteEmail.trim().toLowerCase())
    if (already) {
      alert('You have already invited this student!')
      return
    }

    setSending(true)

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail.trim().toLowerCase())
      .single()

    const { error } = await supabase
      .from('coach_students')
      .insert([{
        coach_id: userId,
        student_email: inviteEmail.trim().toLowerCase(),
        student_id: existingProfile?.id || null,
        status: 'pending'
      }])

    if (error) {
      alert('Error sending invite: ' + error.message)
      setSending(false)
      return
    }

    setInviteEmail('')
    setShowAddForm(false)
    setSending(false)
    loadStudents()
  }

  async function removeStudent(id) {
    if (!confirm('Remove this student from your list?')) return
    await supabase.from('coach_students').delete().eq('id', id)
    loadStudents()
  }

  const filtered = students.filter(s => {
    const searchLower = search.toLowerCase()
    return (
      (s.name || '').toLowerCase().includes(searchLower) ||
      (s.email || '').toLowerCase().includes(searchLower)
    )
  })

  const accepted = filtered.filter(s => s.status === 'accepted')
  const pending = filtered.filter(s => s.status === 'pending')

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
          style={{ padding: '8px 18px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #eee', color: '#666', fontSize: '13px', fontWeight: '500', backgroundColor: 'white' }}
        >
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>Students</h1>
            <p style={{ color: '#888', marginTop: '4px', fontSize: '15px' }}>
              {accepted.length} active · {pending.length} pending
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#1D9E75', color: 'white', border: 'none', borderRadius: '10px' }}
          >
            + Add student
          </button>
        </div>

        {showAddForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #eee', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 6px 0' }}>Invite a student</h3>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 16px 0' }}>
              Enter their email address. They'll see a pending invite when they log in and can accept or decline.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="email"
                placeholder="student@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
              />
              <button
                onClick={sendInvite}
                disabled={sending}
                style={{ padding: '10px 20px', backgroundColor: '#1D9E75', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
              >
                {sending ? 'Sending...' : 'Send invite'}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setInviteEmail('') }}
                style={{ padding: '10px 16px', cursor: 'pointer', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px', backgroundColor: 'white', color: '#666' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #eee', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#aaa', fontSize: '15px' }}>Loading students...</div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #eee', color: '#888', fontSize: '15px' }}>
            👥 No students yet — click + Add student to invite someone!
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending invites</h2>
                {pending.map((student) => (
                  <div key={student.id} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '18px 24px', marginBottom: '10px', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#aaa', fontWeight: '600' }}>?</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#555' }}>{student.student_email}</div>
                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>Invite sent · waiting for response</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ padding: '4px 12px', backgroundColor: '#FFF8E7', color: '#B07D00', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>⏳ Pending</span>
                      <button onClick={() => removeStudent(student.id)} style={{ padding: '5px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ffcccc', backgroundColor: '#fff5f5', color: '#cc0000' }}>Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {accepted.length > 0 && (
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active students</h2>
                {accepted.map((student) => (
                  <div key={student.id} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '18px 24px', marginBottom: '10px', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'white', fontWeight: '600' }}>
                        {(student.name || student.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600' }}>{student.name || student.email}</div>
                        <div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>
                          {student.name && <span>{student.email} · </span>}
                          {student.location && <span>📍 {student.location} · </span>}
                          {student.age && <span>🎂 Age {student.age} · </span>}
                          {student.level && <span>💪 {student.level}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ padding: '4px 12px', backgroundColor: '#E1F5EE', color: '#0F6E56', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>✅ Active</span>
                      <button onClick={() => removeStudent(student.id)} style={{ padding: '5px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ffcccc', backgroundColor: '#fff5f5', color: '#cc0000' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filtered.length === 0 && search && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '14px' }}>No students match "{search}"</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default StudentsPage