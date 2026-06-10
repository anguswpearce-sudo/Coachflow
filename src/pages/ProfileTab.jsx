import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function ProfileTab({ userId, role, onSignOut }) {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ programmes: 0, sessions: 0, students: 0 })
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  // Coach fields
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [specialities, setSpecialities] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [instagram, setInstagram] = useState('')
  const [phone, setPhone] = useState('')

  // Student fields
  const [sport, setSport] = useState('')
  const [age, setAge] = useState('')
  const [goals, setGoals] = useState('')

  useEffect(() => { loadProfile(); loadStats() }, [userId])

  async function loadProfile() {
    setLoading(true)
    const table = role === 'coach' ? 'coach_profiles' : 'student_profiles'
    const { data } = await supabase.from(table).select('*').eq('id', userId).single()
    if (data) {
      setProfile(data)
      setName(data.name || '')
      setBio(data.bio || '')
      setLocation(data.location || '')
      setSpecialities(data.specialities || '')
      setQualifications(data.qualifications || '')
      setYearsExperience(data.years_experience || '')
      setInstagram(data.instagram || '')
      setPhone(data.phone || '')
      setSport(data.sport || '')
      setAge(data.age || '')
      setGoals(data.goals || '')
    } else {
      setEditing(true)
    }
    setLoading(false)
  }

  async function loadStats() {
    if (role === 'coach') {
      const { count: progCount } = await supabase
        .from('programmes')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', userId)

      const { count: studentCount } = await supabase
        .from('coach_students')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', userId)
        .eq('status', 'accepted')

      const { count: subCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .in('programme_id',
          (await supabase.from('programmes').select('id').eq('coach_id', userId)).data?.map(p => p.id) || []
        )

      setStats({ programmes: progCount || 0, students: studentCount || 0, submissions: subCount || 0 })
    } else {
      const { data: prof } = await supabase.from('profiles').select('email').eq('id', userId).single()
      if (!prof) return

      const { count: progCount } = await supabase
        .from('programmes')
        .select('*', { count: 'exact', head: true })
        .eq('student_email', prof.email)

      const { count: subCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', userId)

      setStats({ programmes: progCount || 0, submissions: subCount || 0, streak: 0 })
    }
  }

  async function saveProfile() {
    setSaving(true)
    const table = role === 'coach' ? 'coach_profiles' : 'student_profiles'
    const payload = role === 'coach'
      ? { id: userId, name, bio, location, specialities, qualifications, years_experience: parseInt(yearsExperience) || 0, instagram, phone }
      : { id: userId, name, bio, location, sport, age: parseInt(age) >= 16 ? parseInt(age) : null, goals }

    const { error } = await supabase.from(table).upsert(payload)
    if (error) { alert('Error saving: ' + error.message); setSaving(false); return }
    await loadProfile()
    setEditing(false)
    setSaving(false)
  }

  const shareLink = role === 'coach' ? `${window.location.origin}/coach/${userId}` : `${window.location.origin}/student/${userId}`

  if (loading) return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#555', fontSize: '15px' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>

      {/* Header */}
      <div style={{ padding: '56px 20px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Profile</div>
        {!editing && (
          <button onClick={() => setEditing(true)} style={{ padding: '8px 16px', backgroundColor: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '10px', color: '#1D9E75', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ padding: '0 20px 100px 20px' }}>
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '13px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>Edit Profile</div>

            {[
              { label: 'Full name', value: name, set: setName, placeholder: 'Your name' },
              { label: 'Location', value: location, set: setLocation, placeholder: 'e.g. Sydney, NSW' },
              ...(role === 'coach' ? [
                { label: 'Specialities', value: specialities, set: setSpecialities, placeholder: 'e.g. Strength, HIIT, Yoga' },
                { label: 'Years experience', value: yearsExperience, set: setYearsExperience, placeholder: 'e.g. 5', type: 'number' },
                { label: 'Instagram', value: instagram, set: setInstagram, placeholder: '@yourhandle' },
                { label: 'Phone', value: phone, set: setPhone, placeholder: '0400 000 000' },
              ] : [
                { label: 'Sport / discipline', value: sport, set: setSport, placeholder: 'e.g. Rugby, Swimming, CrossFit' },
                { label: 'Age (16+)', value: age, set: setAge, placeholder: 'e.g. 22', type: 'number' },
              ]),
            ].map((field, i) => (
              <div key={i} style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{field.label}</label>
                <input type={field.type || 'text'} value={field.value} onChange={(e) => field.set(e.target.value)} placeholder={field.placeholder} style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              </div>
            ))}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about yourself..." style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', minHeight: '80px', fontFamily: 'inherit' }} />
            </div>

            {role === 'coach' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Qualifications</label>
                <textarea value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder="e.g. Cert IV in Fitness..." style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', minHeight: '80px', fontFamily: 'inherit' }} />
              </div>
            )}

            {role === 'student' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Goals</label>
                <textarea value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="e.g. Build strength, lose weight..." style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', minHeight: '80px', fontFamily: 'inherit' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button onClick={saveProfile} disabled={saving} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #1D9E75, #0a5c43)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                {saving ? 'Saving...' : '✓ Save'}
              </button>
              {profile && <button onClick={() => setEditing(false)} style={{ padding: '14px 20px', backgroundColor: 'transparent', border: '1px solid #222', borderRadius: '12px', color: '#555', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 20px 100px 20px' }}>

          {/* Avatar card */}
          <div style={{ backgroundColor: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #1a1a1a', marginBottom: '12px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: role === 'coach' ? 'linear-gradient(135deg, #1D9E75, #0a5c43)' : 'linear-gradient(135deg, #6366f1, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '800', color: 'white', margin: '0 auto 16px auto', border: `3px solid ${role === 'coach' ? '#1D9E75' : '#6366f1'}` }}>
              {(profile?.name || '?')[0]?.toUpperCase()}
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{profile?.name || 'No name set'}</div>
            <div style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>
              {role === 'coach' && profile?.years_experience > 0 && `${profile.years_experience} yrs exp · `}
              {role === 'student' && profile?.sport && `🏅 ${profile.sport} · `}
              {profile?.location && `📍 ${profile.location}`}
            </div>
            <span style={{ padding: '6px 14px', backgroundColor: role === 'coach' ? 'rgba(29,158,117,0.15)' : 'rgba(99,102,241,0.15)', color: role === 'coach' ? '#1D9E75' : '#818cf8', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: `1px solid ${role === 'coach' ? 'rgba(29,158,117,0.3)' : 'rgba(99,102,241,0.3)'}`, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {role === 'coach' ? '🎯 Coach' : '⚡ Athlete'}
            </span>

            {profile?.bio && (
              <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', marginTop: '16px', marginBottom: '0', textAlign: 'left' }}>{profile.bio}</p>
            )}
          </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
            {(role === 'coach' ? [
              { label: 'Programmes', value: stats.programmes, icon: '📋' },
              { label: 'Students', value: stats.students, icon: '👥' },
              { label: 'Submissions', value: stats.submissions, icon: '📥' },
            ] : [
              { label: 'Programmes', value: stats.programmes, icon: '📋' },
              { label: 'Submissions', value: stats.submissions, icon: '📤' },
              { label: 'Streak', value: `${profile?.current_streak || 0}d`, icon: '🔥' },
            ]).map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#111', borderRadius: '14px', padding: '16px 12px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{stat.icon}</div>
                <div style={{ fontSize: '20px', fontWeight: '800' }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Student extras */}
          {role === 'student' && profile?.goals && (
            <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '18px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Goals</div>
              <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.6', margin: 0 }}>{profile.goals}</p>
            </div>
          )}

          {/* Coach extras */}
          {role === 'coach' && profile?.specialities && (
            <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '18px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Specialities</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {profile.specialities.split(',').map((s, i) => (
                  <span key={i} style={{ padding: '5px 12px', backgroundColor: 'rgba(29,158,117,0.1)', color: '#1D9E75', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(29,158,117,0.2)' }}>{s.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {/* Share profile */}
          <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '18px', border: '1px solid #1a1a1a', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Share Profile</div>
            <div style={{ fontSize: '12px', color: '#444', marginBottom: '10px', wordBreak: 'break-all', padding: '8px 12px', backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #1a1a1a' }}>{shareLink}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { navigator.clipboard.writeText(shareLink); alert('Copied!') }} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '10px', color: '#1D9E75', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>📋 Copy link</button>
              <a href={`https://wa.me/?text=${encodeURIComponent('Check out my CoachFlow profile: ' + shareLink)}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '10px', color: '#25D366', fontSize: '12px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' }}>💬 WhatsApp</a>
            </div>
          </div>

          {/* Settings */}
          <div style={{ backgroundColor: '#111', borderRadius: '16px', border: '1px solid #1a1a1a', marginBottom: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a1a1a' }}>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Settings</div>
            </div>
            {[
              { label: 'Notifications', sub: 'Get notified about activity', icon: '🔔' },
              { label: 'Privacy', sub: 'Control who sees your profile', icon: '🔒' },
              { label: 'Help & Support', sub: 'FAQs and contact us', icon: '❓' },
              { label: 'About CoachFlow', sub: 'Version 1.0', icon: 'ℹ️' },
            ].map((item, i, arr) => (
              <div key={i} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: i < arr.length - 1 ? '1px solid #1a1a1a' : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '1px' }}>{item.sub}</div>
                </div>
                <div style={{ color: '#333', fontSize: '16px' }}>›</div>
              </div>
            ))}
          </div>

          {/* Sign out */}
          {!showSignOutConfirm ? (
            <button onClick={() => setShowSignOutConfirm(true)} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: '1px solid #222', borderRadius: '14px', color: '#555', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginBottom: '12px' }}>
              Sign out
            </button>
          ) : (
            <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #333', marginBottom: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Sign out?</div>
              <div style={{ fontSize: '13px', color: '#555', marginBottom: '16px' }}>You'll need to sign back in to access your account.</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={onSignOut} style={{ flex: 1, padding: '12px', backgroundColor: '#f43f5e', border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Yes, sign out</button>
                <button onClick={() => setShowSignOutConfirm(false)} style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1px solid #222', borderRadius: '12px', color: '#555', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#333', paddingBottom: '8px' }}>
            CoachFlow v1.0 · Made with ❤️
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileTab