import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function DiscoverTab({ userId, role }) {
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSpeciality, setFilterSpeciality] = useState('')
  const [selectedCoach, setSelectedCoach] = useState(null)
  const [requestStatus, setRequestStatus] = useState({})

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  useEffect(() => {
    loadCoaches()
    if (role === 'student') loadMyRequests()
  }, [])

  async function loadCoaches() {
    setLoading(true)
    const { data } = await supabase
      .from('coach_profiles')
      .select('*')
      .not('name', 'is', null)
    setCoaches(data || [])
    setLoading(false)
  }

  async function loadMyRequests() {
    const { data } = await supabase
      .from('coach_students')
      .select('coach_id, status')
      .eq('student_id', userId)
    if (data) {
      const map = {}
      data.forEach(row => { map[row.coach_id] = row.status })
      setRequestStatus(map)
    }
  }

  async function requestToTrain(coach) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    const { error } = await supabase
      .from('coach_students')
      .insert([{
        coach_id: coach.id,
        student_email: profile?.email || '',
        student_id: userId,
        status: 'pending'
      }])

    if (error) {
      alert('Error sending request: ' + error.message)
      return
    }
    setRequestStatus({ ...requestStatus, [coach.id]: 'pending' })
  }

  async function sendCoachInvite() {
    if (!inviteEmail.trim()) {
      alert('Please enter a student email!')
      return
    }
    setInviteSending(true)

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
      setInviteSending(false)
      return
    }

    setInviteEmail('')
    setInviteSending(false)
    setInviteSent(true)
    setTimeout(() => setInviteSent(false), 3000)
  }

  const allSpecialities = [...new Set(
    coaches.flatMap(c => (c.specialities || '').split(',').map(s => s.trim()).filter(Boolean))
  )]

  const filtered = coaches.filter(c => {
    const matchSearch = !search ||
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(search.toLowerCase())
    const matchSpec = !filterSpeciality ||
      (c.specialities || '').toLowerCase().includes(filterSpeciality.toLowerCase())
    return matchSearch && matchSpec
  })

  if (selectedCoach) {
    const myStatus = requestStatus[selectedCoach.id]

    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
        <div style={{ padding: '56px 20px 20px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setSelectedCoach(null)}
            style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}
          >
            Back
          </button>
          <div style={{ fontSize: '16px', fontWeight: '700' }}>Coach Profile</div>
        </div>

        <div style={{ padding: '0 20px 40px 20px' }}>
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '28px', border: '1px solid #1a1a1a', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #1D9E75, #0a5c43)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: '800', color: 'white', flexShrink: 0,
                border: '3px solid #1D9E75'
              }}>
                {(selectedCoach.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800' }}>{selectedCoach.name}</div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  {Number(selectedCoach.years_experience) > 0 ? `${selectedCoach.years_experience} yrs exp` : ''}
                  {selectedCoach.location ? ` · 📍 ${selectedCoach.location}` : ''}
                </div>
              </div>
            </div>

            {selectedCoach.bio && (
              <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.7', marginBottom: '20px' }}>
                {selectedCoach.bio}
              </p>
            )}

            {selectedCoach.specialities && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Specialities</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedCoach.specialities.split(',').map((s, i) => (
                    <span key={i} style={{ padding: '5px 12px', backgroundColor: 'rgba(29,158,117,0.15)', color: '#1D9E75', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(29,158,117,0.3)' }}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedCoach.qualifications && (
              <div>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Qualifications</div>
                <p style={{ fontSize: '13px', color: '#aaa', lineHeight: '1.6' }}>{selectedCoach.qualifications}</p>
              </div>
            )}
          </div>

          
  <button
            onClick={() => window.location.href = `/coach/${selectedCoach.id}`}
            style={{
              display: 'block',
              width: '100%',
              padding: '16px',
              backgroundColor: '#111',
              border: '1px solid #222',
              borderRadius: '14px',
              textAlign: 'center',
              color: '#aaa',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '12px',
            }}
          >
            View Full Profile →
          </button>

          {role === 'student' && (
            <>
              {!myStatus && (
                <button
                  onClick={() => requestToTrain(selectedCoach)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #1D9E75, #0a5c43)',
                    borderRadius: '14px',
                    textAlign: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '15px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  🤝 Request to train with {selectedCoach.name?.split(' ')[0]}
                </button>
              )}
              {myStatus === 'pending' && (
                <div style={{ padding: '16px', backgroundColor: '#1a1a00', border: '1px solid #F59E0B', borderRadius: '14px', textAlign: 'center', color: '#F59E0B', fontWeight: '600', fontSize: '14px' }}>
                  ⏳ Request sent — waiting for {selectedCoach.name?.split(' ')[0]} to accept
                </div>
              )}
              {myStatus === 'accepted' && (
                <div style={{ padding: '16px', backgroundColor: 'rgba(29,158,117,0.15)', border: '1px solid #1D9E75', borderRadius: '14px', textAlign: 'center', color: '#1D9E75', fontWeight: '600', fontSize: '14px' }}>
                  ✅ You're already training with {selectedCoach.name?.split(' ')[0]}!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>

      <div style={{ padding: '56px 20px 20px 20px' }}>
        <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '4px' }}>Discover</div>
        <div style={{ fontSize: '14px', color: '#555' }}>
          {role === 'coach' ? 'Invite students to train with you' : 'Find your perfect coach'}
        </div>
      </div>

      {role === 'coach' && (
        <div style={{ padding: '0 20px 24px 20px' }}>
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>📨 Invite a student</div>
            <div style={{ fontSize: '13px', color: '#555', marginBottom: '16px' }}>
              Enter their email — they'll see a pending invite when they log in.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="email"
                placeholder="student@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendCoachInvite()}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #222',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: 'white',
                  outline: 'none',
                }}
              />
              <button
                onClick={sendCoachInvite}
                disabled={inviteSending}
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #1D9E75, #0a5c43)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                }}
              >
                {inviteSending ? 'Sending...' : 'Send invite'}
              </button>
            </div>
            {inviteSent && (
              <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: 'rgba(29,158,117,0.15)', border: '1px solid #1D9E75', borderRadius: '10px', color: '#1D9E75', fontSize: '13px', fontWeight: '600' }}>
                ✅ Invite sent! They'll see it when they log in.
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '0 20px 16px 20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {role === 'coach' ? 'Browse all coaches' : 'Find a coach'}
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '13px 14px 13px 42px',
              backgroundColor: '#111',
              border: '1px solid #222',
              borderRadius: '14px',
              fontSize: '14px',
              color: 'white',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {allSpecialities.length > 0 && (
        <div style={{ padding: '0 20px 20px 20px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '8px', paddingBottom: '4px' }}>
            <button
              onClick={() => setFilterSpeciality('')}
              style={{ padding: '7px 14px', borderRadius: '20px', border: `1px solid ${!filterSpeciality ? '#1D9E75' : '#222'}`, backgroundColor: !filterSpeciality ? 'rgba(29,158,117,0.15)' : 'transparent', color: !filterSpeciality ? '#1D9E75' : '#555', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              All
            </button>
            {allSpecialities.map((s, i) => (
              <button
                key={i}
                onClick={() => setFilterSpeciality(s === filterSpeciality ? '' : s)}
                style={{ padding: '7px 14px', borderRadius: '20px', border: `1px solid ${filterSpeciality === s ? '#1D9E75' : '#222'}`, backgroundColor: filterSpeciality === s ? 'rgba(29,158,117,0.15)' : 'transparent', color: filterSpeciality === s ? '#1D9E75' : '#555', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '0 20px 12px 20px' }}>
        <div style={{ fontSize: '12px', color: '#555', fontWeight: '600', letterSpacing: '0.5px' }}>
          {loading ? 'Loading...' : `${filtered.length} coach${filtered.length !== 1 ? 'es' : ''} found`}
        </div>
      </div>

      <div style={{ padding: '0 20px 24px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>Loading coaches...</div>
        ) : filtered.length === 0 ? (
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>No coaches found</div>
            <div style={{ fontSize: '13px', color: '#555' }}>Try adjusting your search or filters</div>
          </div>
        ) : (
          filtered.map((coach, i) => {
            const myStatus = requestStatus[coach.id]
            return (
              <div
                key={i}
                onClick={() => setSelectedCoach(coach)}
                style={{ backgroundColor: '#111', borderRadius: '20px', padding: '20px', marginBottom: '12px', border: '1px solid #1a1a1a', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: 'white', flexShrink: 0 }}>
                    {(coach.name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '3px' }}>{coach.name}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>
                      {Number(coach.years_experience) > 0 ? `${coach.years_experience} yrs · ` : ''}
                      {coach.location ? `📍 ${coach.location}` : ''}
                    </div>
                  </div>
                  {role === 'student' && myStatus === 'pending' && (
                    <span style={{ fontSize: '11px', backgroundColor: '#1a1a00', color: '#F59E0B', padding: '4px 10px', borderRadius: '20px', fontWeight: '600', border: '1px solid #F59E0B', whiteSpace: 'nowrap' }}>⏳ Pending</span>
                  )}
                  {role === 'student' && myStatus === 'accepted' && (
                    <span style={{ fontSize: '11px', backgroundColor: 'rgba(29,158,117,0.15)', color: '#1D9E75', padding: '4px 10px', borderRadius: '20px', fontWeight: '600', border: '1px solid #1D9E75', whiteSpace: 'nowrap' }}>✅ Training</span>
                  )}
                  {(!myStatus || role === 'coach') && <div style={{ fontSize: '18px', color: '#333' }}>›</div>}
                </div>

                {coach.specialities && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {coach.specialities.split(',').slice(0, 3).map((s, j) => (
                      <span key={j} style={{ padding: '4px 10px', backgroundColor: 'rgba(29,158,117,0.1)', color: '#1D9E75', borderRadius: '20px', fontSize: '11px', fontWeight: '600', border: '1px solid rgba(29,158,117,0.2)' }}>
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default DiscoverTab