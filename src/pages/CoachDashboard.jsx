import { useState } from 'react'
import { supabase } from '../supabase'
import CoachProfile from './CoachProfile'
import ProgrammeDetail from './ProgrammeDetail'
import StudentsPage from './StudentsPage'
import SubmissionsPage from './SubmissionsPage'

function CoachDashboard({ onSignOut, userId }) {
  const [showForm, setShowForm] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showStudents, setShowStudents] = useState(false)
  const [showSubmissions, setShowSubmissions] = useState(false)
  const [selectedProgramme, setSelectedProgramme] = useState(null)
  const [programmeName, setProgrammeName] = useState('')
  const [studentName, setStudentName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [activities, setActivities] = useState([])
  const [newActivityName, setNewActivityName] = useState('')
  const [newActivityDetail, setNewActivityDetail] = useState('')
  const [newActivityVideo, setNewActivityVideo] = useState(false)
  const [programmes, setProgrammes] = useState([
    {
      name: 'Upper body strength — week 1',
      student: 'Jamie Chen',
      due: '15 May 2026',
      activities: [
        { name: 'Push-ups', detail: '3 sets x 15 reps', requiresVideo: true },
        { name: 'Dumbbell rows', detail: '3 sets x 12 reps', requiresVideo: true },
        { name: 'Plank hold', detail: '3 x 45 seconds', requiresVideo: false },
      ]
    }
  ])

  async function handleCreate() {
    if (programmeName === '' || studentName === '') {
      alert('Please fill in the programme name and student name!')
      return
    }

    const newProgramme = {
      coach_id: userId,
      student_email: studentName,
      name: programmeName,
      due_date: dueDate,
      activities: activities,
    }

    const { error } = await supabase
      .from('programmes')
      .insert([newProgramme])

    if (error) {
      alert('Error saving programme: ' + error.message)
      return
    }

    setProgrammes([...programmes, {
      name: programmeName,
      student: studentName,
      due: dueDate,
      activities: activities,
    }])

    setProgrammeName('')
    setStudentName('')
    setDueDate('')
    setActivities([])
    setNewActivityName('')
    setNewActivityDetail('')
    setNewActivityVideo(false)
    setShowForm(false)
  }

  if (showProfile) {
    return <CoachProfile userId={userId} onBack={() => setShowProfile(false)} />
  }

  if (selectedProgramme) {
    return <ProgrammeDetail programme={selectedProgramme} onBack={() => setSelectedProgramme(null)} />
  }

  if (showStudents) {
    return <StudentsPage onBack={() => setShowStudents(false)} />
  }

  if (showSubmissions) {
    return <SubmissionsPage onBack={() => setShowSubmissions(false)} />
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowProfile(true)}
            style={{
              padding: '8px 18px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid #1D9E75',
              color: '#1D9E75',
              fontSize: '13px',
              fontWeight: '500',
              backgroundColor: 'white'
            }}
          >
            My profile
          </button>
          <button
            onClick={onSignOut}
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
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Coach Dashboard
          </h1>
          <p style={{ color: '#888', marginTop: '4px', fontSize: '15px' }}>
            Manage your programmes and students
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Active programmes', value: programmes.length, emoji: '📋', onClick: null },
            { label: 'Students', value: '4', emoji: '👥', onClick: () => setShowStudents(true) },
            { label: 'Submissions', value: '2', emoji: '📥', onClick: () => setShowSubmissions(true) },
          ].map((stat, i) => (
            <div
              key={i}
              onClick={stat.onClick}
              style={{
                backgroundColor: 'white',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid #eee',
                cursor: stat.onClick ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{stat.emoji}</div>
              <div style={{ fontSize: '26px', fontWeight: '700' }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{stat.label}</div>
              {stat.onClick && (
                <div style={{ fontSize: '12px', color: '#1D9E75', marginTop: '6px', fontWeight: '500' }}>
                  View all →
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Your Programmes</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: '#1D9E75',
                color: 'white',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              + New programme
            </button>
          )}
        </div>

        {programmes.map((programme, index) => (
          <div key={index} style={{
            backgroundColor: 'white',
            borderRadius: '14px',
            padding: '20px 24px',
            marginBottom: '12px',
            border: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{programme.name}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
                👤 {programme.student} · 📅 Due {programme.due || 'No date set'} · {programme.activities?.length || 0} activities
              </div>
            </div>
            <button
              onClick={() => setSelectedProgramme(programme)}
              style={{
                padding: '7px 16px',
                fontSize: '13px',
                cursor: 'pointer',
                borderRadius: '8px',
                border: '1px solid #eee',
                backgroundColor: 'white',
                color: '#555',
                fontWeight: '500'
              }}
            >
              View →
            </button>
          </div>
        ))}

        {showForm && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid #eee',
            marginTop: '16px'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '20px' }}>
              Create new programme
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '6px' }}>
                Programme name
              </label>
              <input
                type="text"
                placeholder="e.g. Upper body strength week 2"
                value={programmeName}
                onChange={(e) => setProgrammeName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '6px' }}>
                Student email
              </label>
              <input
                type="text"
                placeholder="Student's email e.g. student@gmail.com"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '6px' }}>
                Due date
              </label>
              <input
                type="text"
                placeholder="e.g. 20 May 2026"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '10px' }}>
                Activities
              </label>

              {activities.map((act, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '500' }}>{act.name}</span>
                    <span style={{ color: '#888', marginLeft: '8px' }}>{act.detail}</span>
                    {act.requiresVideo && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#854F0B' }}>📹 video required</span>}
                  </div>
                  <button
                    onClick={() => setActivities(activities.filter((_, idx) => idx !== i))}
                    style={{
                      padding: '3px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      border: '1px solid #ffcccc',
                      backgroundColor: '#fff5f5',
                      color: '#cc0000'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div style={{
                padding: '14px',
                border: '1px dashed #ddd',
                borderRadius: '10px',
                marginTop: '8px'
              }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Activity name e.g. Push-ups"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #eee', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                  />
                  <input
                    type="text"
                    placeholder="Detail e.g. 3 x 15 reps"
                    value={newActivityDetail}
                    onChange={(e) => setNewActivityDetail(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #eee', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newActivityVideo}
                      onChange={(e) => setNewActivityVideo(e.target.checked)}
                    />
                    Require video submission
                  </label>
                  <button
                    onClick={() => {
                      if (newActivityName.trim() === '') return
                      setActivities([...activities, {
                        name: newActivityName.trim(),
                        detail: newActivityDetail.trim(),
                        requiresVideo: newActivityVideo
                      }])
                      setNewActivityName('')
                      setNewActivityDetail('')
                      setNewActivityVideo(false)
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#1D9E75',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    + Add activity
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCreate}
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
                Save programme
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: '10px 24px',
                  cursor: 'pointer',
                  borderRadius: '10px',
                  border: '1px solid #eee',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: 'white'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoachDashboard