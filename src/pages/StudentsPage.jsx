import { useState } from 'react'

const allStudents = [
  { id: 1, name: 'Jamie Chen', age: 24, location: 'Sydney', fitnessLevel: 'Intermediate', programmeType: 'Strength', submissionStatus: 'Submitted', avatar: 'J' },
  { id: 2, name: 'Alex Morgan', age: 31, location: 'Melbourne', fitnessLevel: 'Advanced', programmeType: 'HIIT', submissionStatus: 'Pending', avatar: 'A' },
  { id: 3, name: 'Sam Patel', age: 19, location: 'Brisbane', fitnessLevel: 'Beginner', programmeType: 'Mobility', submissionStatus: 'Submitted', avatar: 'S' },
  { id: 4, name: 'Riley Torres', age: 27, location: 'Perth', fitnessLevel: 'Intermediate', programmeType: 'Strength', submissionStatus: 'Pending', avatar: 'R' },
  { id: 5, name: 'Jordan Lee', age: 22, location: 'Sydney', fitnessLevel: 'Beginner', programmeType: 'Cardio', submissionStatus: 'Submitted', avatar: 'J' },
]

const defaultLevels = ['Beginner', 'Intermediate', 'Advanced']

function StudentsPage({ onBack }) {
  const [search, setSearch] = useState('')
  const [filterAge, setFilterAge] = useState('All')
  const [filterLevel, setFilterLevel] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterLocation, setFilterLocation] = useState('All')
  const [customLevels, setCustomLevels] = useState([])
  const [showAddLevel, setShowAddLevel] = useState(false)
  const [newLevel, setNewLevel] = useState('')

  const allLevels = [...defaultLevels, ...customLevels]

  function addCustomLevel() {
    if (newLevel.trim() === '') return
    if (allLevels.includes(newLevel.trim())) {
      alert('That level already exists!')
      return
    }
    setCustomLevels([...customLevels, newLevel.trim()])
    setNewLevel('')
    setShowAddLevel(false)
  }

  function removeCustomLevel(level) {
    setCustomLevels(customLevels.filter(l => l !== level))
    if (filterLevel === level) setFilterLevel('All')
  }

  const filtered = allStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchAge = filterAge === 'All' ||
      (filterAge === 'Under 20' && s.age < 20) ||
      (filterAge === '20-25' && s.age >= 20 && s.age <= 25) ||
      (filterAge === '26-30' && s.age >= 26 && s.age <= 30) ||
      (filterAge === 'Over 30' && s.age > 30)
    const matchLevel = filterLevel === 'All' || s.fitnessLevel === filterLevel
    const matchType = filterType === 'All' || s.programmeType === filterType
    const matchStatus = filterStatus === 'All' || s.submissionStatus === filterStatus
    const matchLocation = filterLocation === 'All' || s.location === filterLocation
    return matchSearch && matchAge && matchLevel && matchType && matchStatus && matchLocation
  })

  const selectStyle = {
    padding: '8px 12px',
    border: '1px solid #eee',
    borderRadius: '8px',
    fontSize: '13px',
    backgroundColor: 'white',
    color: '#444',
    cursor: 'pointer',
    outline: 'none'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5' }}>

      {/* Navbar */}
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
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>Students</h1>
          <p style={{ color: '#888', marginTop: '4px', fontSize: '15px' }}>
            {filtered.length} student{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="🔍 Search students by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #eee',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #eee',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#888' }}>
              Filters:
            </div>

            <select style={selectStyle} value={filterAge} onChange={(e) => setFilterAge(e.target.value)}>
              <option value="All">All ages</option>
              <option value="Under 20">Under 20</option>
              <option value="20-25">20–25</option>
              <option value="26-30">26–30</option>
              <option value="Over 30">Over 30</option>
            </select>

            <select style={selectStyle} value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="All">All levels</option>
              {allLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>

            <select style={selectStyle} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="All">All programmes</option>
              <option value="Strength">Strength</option>
              <option value="HIIT">HIIT</option>
              <option value="Mobility">Mobility</option>
              <option value="Cardio">Cardio</option>
            </select>

            <select style={selectStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending">Pending</option>
            </select>

            <select style={selectStyle} value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
              <option value="All">All locations</option>
              <option value="Sydney">Sydney</option>
              <option value="Melbourne">Melbourne</option>
              <option value="Brisbane">Brisbane</option>
              <option value="Perth">Perth</option>
            </select>

            {(filterAge !== 'All' || filterLevel !== 'All' || filterType !== 'All' || filterStatus !== 'All' || filterLocation !== 'All' || search !== '') && (
              <button
                onClick={() => { setFilterAge('All'); setFilterLevel('All'); setFilterType('All'); setFilterStatus('All'); setFilterLocation('All'); setSearch('') }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ffcccc',
                  borderRadius: '8px',
                  fontSize: '13px',
                  backgroundColor: '#fff5f5',
                  color: '#cc0000',
                  cursor: 'pointer'
                }}
              >
                Clear ✕
              </button>
            )}
          </div>

          {/* Custom levels section */}
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#888' }}>
                Custom levels:
              </div>

              {customLevels.length === 0 && !showAddLevel && (
                <div style={{ fontSize: '13px', color: '#bbb' }}>None added yet</div>
              )}

              {customLevels.map(level => (
                <div key={level} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  backgroundColor: '#E1F5EE',
                  borderRadius: '20px',
                  fontSize: '13px',
                  color: '#0F6E56',
                  fontWeight: '500'
                }}>
                  {level}
                  <span
                    onClick={() => removeCustomLevel(level)}
                    style={{ cursor: 'pointer', fontSize: '12px', color: '#888' }}
                  >
                    ✕
                  </span>
                </div>
              ))}

              {showAddLevel ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="e.g. Club, Elite, White Belt..."
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomLevel()}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #1D9E75',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                      width: '200px'
                    }}
                    autoFocus
                  />
                  <button
                    onClick={addCustomLevel}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#1D9E75',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowAddLevel(false); setNewLevel('') }}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: 'white',
                      color: '#666',
                      border: '1px solid #eee',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddLevel(true)}
                  style={{
                    padding: '5px 12px',
                    backgroundColor: 'white',
                    color: '#1D9E75',
                    border: '1px solid #1D9E75',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  + Add custom level
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student list */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #eee',
            color: '#888',
            fontSize: '15px'
          }}>
            No students match your filters 🔍
          </div>
        ) : (
          filtered.map((student) => (
            <div key={student.id} style={{
              backgroundColor: 'white',
              borderRadius: '14px',
              padding: '20px 24px',
              marginBottom: '12px',
              border: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#1D9E75',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: 'white',
                fontWeight: '600',
                flexShrink: 0
              }}>
                {student.avatar}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{student.name}</div>
                <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
                  📍 {student.location} · 🎂 Age {student.age} · 💪 {student.fitnessLevel}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: '#E1F5EE',
                  color: '#0F6E56'
                }}>
                  {student.programmeType}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: student.submissionStatus === 'Submitted' ? '#E1F5EE' : '#FAEEDA',
                  color: student.submissionStatus === 'Submitted' ? '#0F6E56' : '#854F0B'
                }}>
                  {student.submissionStatus === 'Submitted' ? '✅ Submitted' : '⏳ Pending'}
                </span>
                <button style={{
                  padding: '7px 14px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  backgroundColor: 'white',
                  color: '#555',
                  fontWeight: '500'
                }}>
                  View →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default StudentsPage