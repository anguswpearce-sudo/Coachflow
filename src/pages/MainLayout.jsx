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
      case 'home':     return <HomeTab userId={userId} role={role} onSignOut={onSignOut} onNavigate={setActiveTab} onOpenProgramme={navigateToProgramme} onShowNotifications={() => setShowNotifications(true)} unreadNotifications={unreadCount} />
      case 'discover': return <DiscoverTab userId={userId} role={role} />
      case 'train':    return <TrainTab userId={userId} role={role} initialProgramme={openProgramme} onClearProgramme={() => setOpenProgramme(null)} />
      case 'play':     return <PlayTab userId={userId} role={role} />
      case 'profile':  return <ProfileTab userId={userId} role={role} onSignOut={onSignOut} />
      default:         return <HomeTab userId={userId} role={role} onSignOut={onSignOut} onNavigate={setActiveTab} onOpenProgramme={navigateToProgramme} onShowNotifications={() => setShowNotifications(true)} unreadNotifications={unreadCount} />
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