import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import HomeTab from './HomeTab'
import DiscoverTab from './DiscoverTab'
import TrainTab from './TrainTab'
import PlayTab from './PlayTab'
import ProfileTab from './ProfileTab'
import NotificationsPage from './NotificationsPage'

const tabs = [
  { id: 'home',     label: 'Home',     icon: '⚡' },
  { id: 'discover', label: 'Discover', icon: '🗺️' },
  { id: 'train',    label: 'Train',    icon: '🏋️' },
  { id: 'play',     label: 'Play',     icon: '🎮' },
  { id: 'profile',  label: 'Profile',  icon: '👤' },
]

function MainLayout({ userId, role, onSignOut }) {
  const [activeTab, setActiveTab] = useState('home')
  const [openProgramme, setOpenProgramme] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const subscriptionRef = useRef(null)

  useEffect(() => {
    loadUnreadCount()
    subscribeToNotifications()
    return () => { if (subscriptionRef.current) subscriptionRef.current.unsubscribe() }
  }, [userId])

  async function loadUnreadCount() {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    setUnreadCount(count || 0)
  }

  function subscribeToNotifications() {
    subscriptionRef.current = supabase
      .channel('notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, () => {
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()
  }

  // Helper to create a notification from anywhere in the app
  async function createNotification(targetUserId, type, title, body = '', data = {}) {
    await supabase.from('notifications').insert([{
      user_id: targetUserId,
      type,
      title,
      body,
      data,
      read: false,
    }])
  }

  function navigateToProgramme(programme) {
    setOpenProgramme(programme)
    setActiveTab('train')
  }

  if (showNotifications) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', maxWidth: '430px', margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <NotificationsPage
          userId={userId}
          onBack={() => setShowNotifications(false)}
          onMarkAllRead={() => setUnreadCount(0)}
        />
      </div>
    )
  }

  function renderTab() {
    switch (activeTab) {
      case 'home':     return <HomeTab userId={userId} role={role} onSignOut={onSignOut} onNavigate={setActiveTab} onOpenProgramme={navigateToProgramme} />
      case 'discover': return <DiscoverTab userId={userId} role={role} />
      case 'train':    return <TrainTab userId={userId} role={role} initialProgramme={openProgramme} onClearProgramme={() => setOpenProgramme(null)} />
      case 'play':     return <PlayTab userId={userId} role={role} />
      case 'profile':  return <ProfileTab userId={userId} role={role} onSignOut={onSignOut} />
      default:         return <HomeTab userId={userId} role={role} onSignOut={onSignOut} onNavigate={setActiveTab} onOpenProgramme={navigateToProgramme} />
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

      {/* Global notification bell — sits top right over all tabs */}
      <div style={{
        position: 'fixed',
        top: '14px',
        right: '50%',
        transform: 'translateX(calc(215px - 52px))',
        zIndex: 999,
      }}>
        <button
          onClick={() => setShowNotifications(true)}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: '#111',
            border: '1px solid #222',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: '-2px', right: '-2px',
              minWidth: '16px', height: '16px', borderRadius: '8px',
              backgroundColor: '#f43f5e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: '800', color: 'white',
              border: '2px solid #0a0a0a',
              padding: '0 3px',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
        {renderTab()}
      </div>

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
              onClick={() => { setActiveTab(tab.id); if (tab.id !== 'train') setOpenProgramme(null) }}
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
                position: 'relative',
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