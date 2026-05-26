import { useState } from 'react'
import HomeTab from './HomeTab'
import DiscoverTab from './DiscoverTab'
import TrainTab from './TrainTab'
import PlayTab from './PlayTab'
import ProfileTab from './ProfileTab'

const tabs = [
  { id: 'home',     label: 'Home',     icon: '⚡' },
  { id: 'discover', label: 'Discover', icon: '🗺️' },
  { id: 'train',    label: 'Train',    icon: '🏋️' },
  { id: 'play',     label: 'Play',     icon: '🎮' },
  { id: 'profile',  label: 'Profile',  icon: '👤' },
]

function MainLayout({ userId, role, onSignOut }) {
  const [activeTab, setActiveTab] = useState('home')

  function renderTab() {
    switch (activeTab) {
      case 'home':     return <HomeTab userId={userId} role={role} onSignOut={onSignOut} onNavigate={setActiveTab} />
      case 'discover': return <DiscoverTab userId={userId} role={role} />
      case 'train':    return <TrainTab userId={userId} role={role} />
      case 'play':     return <PlayTab userId={userId} role={role} />
      case 'profile':  return <ProfileTab userId={userId} role={role} onSignOut={onSignOut} />
      default:         return <HomeTab userId={userId} role={role} onSignOut={onSignOut} onNavigate={setActiveTab} />
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '430px',
      margin: '0 auto',
      position: 'relative',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Page content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
        {renderTab()}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        backgroundColor: '#111111',
        borderTop: '1px solid #222',
        display: 'flex',
        zIndex: 1000,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 0 12px 0',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                fontSize: '20px',
                lineHeight: 1,
                filter: isActive ? 'none' : 'grayscale(1) opacity(0.4)',
                transform: isActive ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.15s',
              }}>
                {tab.icon}
              </div>
              <div style={{
                fontSize: '10px',
                fontWeight: isActive ? '700' : '400',
                color: isActive ? '#1D9E75' : '#555',
                letterSpacing: '0.3px',
                transition: 'all 0.15s',
              }}>
                {tab.label}
              </div>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '24px',
                  height: '2px',
                  backgroundColor: '#1D9E75',
                  borderRadius: '2px 2px 0 0',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MainLayout