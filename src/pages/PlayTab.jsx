function PlayTab({ userId, role }) {
  const events = [
    { id: 1, title: '5v5 Football Pickup', location: 'Centennial Park, Sydney', date: 'Sat 31 May', time: '10:00 AM', spots: 4, total: 10, type: 'Football', emoji: '⚽' },
    { id: 2, title: 'Tennis Doubles Round Robin', location: 'Moore Park Tennis', date: 'Sun 1 Jun', time: '2:00 PM', spots: 2, total: 8, type: 'Tennis', emoji: '🎾' },
    { id: 3, title: 'Basketball 3v3 Tournament', location: 'Bondi Pavilion Courts', date: 'Sat 7 Jun', time: '9:00 AM', spots: 6, total: 12, type: 'Basketball', emoji: '🏀' },
    { id: 4, title: 'Morning Run Group', location: 'Manly Beach', date: 'Wed 28 May', time: '6:30 AM', spots: 8, total: 20, type: 'Running', emoji: '🏃' },
  ]

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <div style={{ padding: '56px 20px 20px 20px' }}>
        <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '4px' }}>Play</div>
        <div style={{ fontSize: '14px', color: '#555' }}>Events & games near you</div>
      </div>

      {/* Create event CTA */}
      <div style={{ padding: '0 20px 20px 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(29,158,117,0.2), rgba(10,92,67,0.2))',
          border: '1px solid rgba(29,158,117,0.3)',
          borderRadius: '18px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Host an event</div>
            <div style={{ fontSize: '12px', color: '#555' }}>Create a game or training session</div>
          </div>
          <button style={{
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #1D9E75, #0a5c43)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer'
          }}>
            + Create
          </button>
        </div>
      </div>

      {/* Events list */}
      <div style={{ padding: '0 20px 8px 20px' }}>
        <div style={{ fontSize: '12px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Upcoming Events</div>
      </div>

      <div style={{ padding: '0 20px 24px 20px' }}>
        {events.map((event) => {
          const spotsLeft = event.spots
          const isFull = spotsLeft === 0
          return (
            <div key={event.id} style={{
              backgroundColor: '#111',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '12px',
              border: '1px solid #1a1a1a',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  backgroundColor: 'rgba(29,158,117,0.1)',
                  border: '1px solid rgba(29,158,117,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', flexShrink: 0
                }}>
                  {event.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{event.title}</div>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '2px' }}>📍 {event.location}</div>
                  <div style={{ fontSize: '12px', color: '#555' }}>🗓 {event.date} · {event.time}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>{isFull ? 'Full' : `${spotsLeft} spots left`}</div>
                  <div style={{ width: '80px', height: '4px', backgroundColor: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: isFull ? '#f43f5e' : '#1D9E75', borderRadius: '2px', width: `${((event.total - spotsLeft) / event.total) * 100}%` }} />
                  </div>
                </div>
                <button style={{
                  padding: '10px 20px',
                  backgroundColor: isFull ? 'transparent' : 'rgba(29,158,117,0.15)',
                  border: `1px solid ${isFull ? '#333' : 'rgba(29,158,117,0.4)'}`,
                  borderRadius: '10px',
                  color: isFull ? '#444' : '#1D9E75',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: isFull ? 'default' : 'pointer'
                }}>
                  {isFull ? 'Full' : 'Join →'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '0 20px 32px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#333' }}>More events coming soon 🔜</div>
      </div>
    </div>
  )
}

export default PlayTab