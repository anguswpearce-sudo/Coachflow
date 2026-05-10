import { useState } from 'react'

function CoachDashboard({ onSignOut }) {
  const [showForm, setShowForm] = useState(false)
  const [programmeName, setProgrammeName] = useState('')
  const [studentName, setStudentName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [programmes, setProgrammes] = useState([
    {
      name: 'Upper body strength — week 1',
      student: 'Jamie Chen',
      due: '15 May 2026',
    }
  ])

  function handleCreate() {
    if (programmeName === '' || studentName === '') {
      alert('Please fill in the programme name and student name!')
      return
    }

    const newProgramme = {
      name: programmeName,
      student: studentName,
      due: dueDate,
    }

    setProgrammes([...programmes, newProgramme])
    setProgrammeName('')
    setStudentName('')
    setDueDate('')
    setShowForm(false)
  }

  return (
    <div style={{ padding: '40px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Coach Dashboard</h1>
        <button
          onClick={onSignOut}
          style={{
            padding: '8px 20px',
            cursor: 'pointer',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '14px'
          }}
        >
          Sign out
        </button>
      </div>

      <p>Welcome back, Coach!</p>

      <div style={{ marginTop: '30px' }}>
        <h2>Your Programmes</h2>

        {programmes.map((programme, index) => (
          <div key={index} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '15px',
            maxWidth: '500px'
          }}>
            <h3>{programme.name}</h3>
            <p>Assigned to: {programme.student}</p>
            <p>Due: {programme.due}</p>
            <button style={{
              marginTop: '10px',
              padding: '8px 20px',
              cursor: 'pointer'
            }}>
              View programme
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{
          marginTop: '30px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '500px'
        }}>
          <h2>Create new programme</h2>

          <div style={{ marginTop: '15px' }}>
            <label>Programme name</label>
            <br />
            <input
              type="text"
              placeholder="e.g. Upper body strength week 2"
              value={programmeName}
              onChange={(e) => setProgrammeName(e.target.value)}
              style={{ padding: '8px', width: '100%', marginTop: '5px', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>Student name</label>
            <br />
            <input
              type="text"
              placeholder="e.g. Jamie Chen"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              style={{ padding: '8px', width: '100%', marginTop: '5px', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>Due date</label>
            <br />
            <input
              type="text"
              placeholder="e.g. 20 May 2026"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ padding: '8px', width: '100%', marginTop: '5px', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreate}
              style={{
                padding: '10px 25px',
                backgroundColor: '#1D9E75',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Save programme
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '10px 25px',
                cursor: 'pointer',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <div style={{ marginTop: '30px' }}>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '10px 30px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#1D9E75',
              color: 'white',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            + Create new programme
          </button>
        </div>
      )}

    </div>
  )
}

export default CoachDashboard