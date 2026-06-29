import { useState } from 'react'
import { supabase } from '../supabase'

function Onboarding({ userId, role, onComplete }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Profile fields
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [sport, setSport] = useState('')
  const [specialities, setSpecialities] = useState('')
  const [goals, setGoals] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')

  const totalSteps = 4

  async function saveProfile() {
    setSaving(true)
    const table = role === 'coach' ? 'coach_profiles' : 'student_profiles'
    const payload = role === 'coach'
      ? { id: userId, name: name.trim(), location: location.trim(), specialities: specialities.trim(), years_experience: parseInt(yearsExperience) || 0 }
      : { id: userId, name: name.trim(), location: location.trim(), sport: sport.trim(), goals: goals.trim() }

    await supabase.from(table).upsert(payload)
    setSaving(false)
    setStep(3)
  }

  const tourItems = role === 'coach' ? [
    { icon: '⚡', tab: 'Home', desc: 'See your activity feed and recent programmes at a glance' },
    { icon: '🏋️', tab: 'Train', desc: 'Create and manage training programmes for your students' },
    { icon: '🗺️', tab: 'Discover', desc: 'Find and invite students, browse other coaches' },
    { icon: '🎮', tab: 'Play', desc: 'Set up pick-up games, challenges and events' },
    { icon: '👤', tab: 'Profile', desc: 'Edit your public profile and share your link' },
  ] : [
    { icon: '⚡', tab: 'Home', desc: 'See your activity feed and upcoming sessions' },
    { icon: '🏋️', tab: 'Train', desc: 'Complete your sessions and submit to your coach' },
    { icon: '🗺️', tab: 'Discover', desc: 'Find coaches and request to train with them' },
    { icon: '🎮', tab: 'Play', desc: 'Join pick-up games, challenges and events' },
    { icon: '👤', tab: 'Profile', desc: 'Track your personal bests and achievements' },
  ]

  // ── STEP 0: Welcome ───────────────────────────────────────────
  if (step === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', fontFamily: "'DM Sans', sans-serif"
      }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>
            {role === 'coach' ? '🎯' : '⚡'}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '8px' }}>
            <span style={{ color: '#4ECCA3' }}>Welcome to </span>
            <span style={{ color: 'white' }}>CoachFlow</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', lineHeight: '1.6', marginBottom: '40px' }}>
            {role === 'coach'
              ? "Let's get your coaching profile set up so students can find and train with you."
              : "Let's set up your athlete profile so your coach knows exactly how to help you."}
          </p>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} style={{ width: i === step ? '24px' : '8px', height: '8px', borderRadius: '4px', backgroundColor: i === step ? '#4ECCA3' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #4ECCA3, #1D9E75)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}
          >
            Let's go →
          </button>
        </div>
      </div>
    )
  }

  // ── STEP 1: Basic profile ─────────────────────────────────────
  if (step === 1) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', fontFamily: "'DM Sans', sans-serif"
      }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '8px' }}>
              <span style={{ color: '#4ECCA3' }}>coach</span>
              <span style={{ color: 'white' }}>flow</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>Tell us about yourself</p>
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} style={{ width: i === step ? '24px' : '8px', height: '8px', borderRadius: '4px', backgroundColor: i <= step ? '#4ECCA3' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px' }}>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                {role === 'coach' ? 'Your full name' : 'Your name'}
              </label>
              <input
                type="text"
                placeholder={role === 'coach' ? 'e.g. Sarah Johnson' : 'e.g. Jamie Chen'}
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: '14px', color: 'white', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Sydney, NSW"
                value={location}
                onChange={e => setLocation(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: '14px', color: 'white', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep(0)}
                style={{ padding: '13px 20px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!name.trim()) { alert('Please enter your name!'); return }
                  setStep(2)
                }}
                style={{ flex: 1, padding: '13px', background: 'linear-gradient(135deg, #4ECCA3, #1D9E75)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2: Sport / speciality / goals ────────────────────────
  if (step === 2) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', fontFamily: "'DM Sans', sans-serif"
      }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ width: '100%', maxWidth: '420px' }}>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '8px' }}>
              <span style={{ color: '#4ECCA3' }}>coach</span>
              <span style={{ color: 'white' }}>flow</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>
              {role === 'coach' ? 'Your coaching expertise' : 'Your training profile'}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} style={{ width: i === step ? '24px' : '8px', height: '8px', borderRadius: '4px', backgroundColor: i <= step ? '#4ECCA3' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px' }}>

            {role === 'coach' ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Specialities</label>
                  <input
                    type="text"
                    placeholder="e.g. Strength, HIIT, Yoga (comma separated)"
                    value={specialities}
                    onChange={e => setSpecialities(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: '14px', color: 'white', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Years of experience</label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={yearsExperience}
                    onChange={e => setYearsExperience(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: '14px', color: 'white', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Sport / discipline</label>
                  <input
                    type="text"
                    placeholder="e.g. Rugby, Swimming, CrossFit"
                    value={sport}
                    onChange={e => setSport(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: '14px', color: 'white', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Your goals</label>
                  <textarea
                    placeholder="e.g. Build strength, improve endurance, lose weight..."
                    value={goals}
                    onChange={e => setGoals(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: '14px', color: 'white', outline: 'none', resize: 'none', minHeight: '90px', fontFamily: 'inherit' }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep(1)}
                style={{ padding: '13px 20px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← Back
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{ flex: 1, padding: '13px', background: 'linear-gradient(135deg, #4ECCA3, #1D9E75)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : 'Continue →'}
              </button>
            </div>

            <button
              onClick={() => setStep(3)}
              style={{ width: '100%', marginTop: '12px', padding: '10px', backgroundColor: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 3: App tour ──────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'DM Sans', sans-serif"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
            You're all set!
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>Here's a quick look at what you can do</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ width: i === 3 ? '24px' : '8px', height: '8px', borderRadius: '4px', backgroundColor: '#4ECCA3', transition: 'all 0.3s' }} />
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
          {tourItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0', borderBottom: i < tourItems.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', backgroundColor: 'rgba(78,204,163,0.15)', border: '1px solid rgba(78,204,163,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', marginBottom: '2px' }}>{item.tab}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onComplete}
          style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #4ECCA3, #1D9E75)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Start using CoachFlow 🚀
        </button>
      </div>
    </div>
  )
}

export default Onboarding