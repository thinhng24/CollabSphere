import React, { useState } from 'react';
import { Video, Calendar, Users, MessageSquare, Settings } from 'lucide-react';
import VideoMeetingRoom from './components/meeting/VideoMeetingRoom';
import CollaborativeWhiteboard from './components/meeting/CollaborativeWhiteboard';
import './App.css';

const genId = () => Math.random().toString(36).substring(2, 10);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Meeting state
  const [meetingId, setMeetingId] = useState('');
  const [inMeeting, setInMeeting] = useState(false);

  // Whiteboard state
  const [wbRoom, setWbRoom] = useState('');
  const [inWhiteboard, setInWhiteboard] = useState(false);

  // user info (basic/fallback)
  const userId = localStorage.getItem('userId') || `user-${genId()}`;
  const userName = localStorage.getItem('userName') || 'Người dùng Demo';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Video size={20} /> },
    { id: 'meeting', label: 'Cuộc họp', icon: <Video size={20} /> },
    { id: 'whiteboard', label: 'Whiteboard', icon: <MessageSquare size={20} /> },
    { id: 'schedule', label: 'Lịch họp', icon: <Calendar size={20} /> },
    { id: 'teams', label: 'Nhóm', icon: <Users size={20} /> },
    { id: 'settings', label: 'Cài đặt', icon: <Settings size={20} /> },
  ];

  const startInstantMeeting = () => {
    const id = genId();
    setMeetingId(id);
    setInMeeting(true);
  };

  const joinMeeting = () => {
    if (!meetingId) return alert('Vui lòng nhập ID cuộc họp');
    setInMeeting(true);
  };

  const openWhiteboard = () => {
    const id = wbRoom || genId();
    setWbRoom(id);
    setInWhiteboard(true);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Video size={32} color="#4CAF50" />
            <h1>CollabSphere</h1>
          </div>
          <p className="tagline">Học tập qua dự án</p>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                // reset per-tab sessions when switching
                if (item.id !== 'meeting') {
                  setInMeeting(false);
                }
                if (item.id !== 'whiteboard') {
                  setInWhiteboard(false);
                }
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="user-info">
          <div className="avatar">CS</div>
          <div className="user-details">
            <strong>{userName}</strong>
            <small>{userId}@local</small>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <h2>Chào mừng đến với CollabSphere</h2>
          <p>Hệ thống quản lý dự án học tập PBL</p>
        </header>

        <div className="content">
          {activeTab === 'dashboard' && (
            <div className="welcome-card">
              <h3>🎉 Frontend đã sẵn sàng!</h3>
              <p>Chọn "Cuộc họp" hoặc "Whiteboard" để bắt đầu.</p>

              <div className="features-grid">
                <div className="feature-card">
                  <Video size={24} />
                  <h4>Video Meeting</h4>
                  <p>Khởi tạo hoặc tham gia phòng họp</p>
                </div>

                <div className="feature-card">
                  <MessageSquare size={24} />
                  <h4>Whiteboard</h4>
                  <p>Bảng trắng phối hợp (yêu cầu Socket server)</p>
                </div>

                <div className="feature-card">
                  <Calendar size={24} />
                  <h4>Lịch họp</h4>
                  <p>Đặt lịch và quản lý cuộc họp</p>
                </div>

                <div className="feature-card">
                  <Users size={24} />
                  <h4>Quản lý nhóm</h4>
                  <p>Theo dõi tiến độ và đóng góp</p>
                </div>
              </div>

              <div className="quick-actions">
                <button className="btn-primary" onClick={() => { setActiveTab('meeting'); startInstantMeeting(); }}>
                  <Video size={16} /> Bắt đầu cuộc họp
                </button>
                <button className="btn-secondary" onClick={() => setActiveTab('whiteboard')}>
                  <MessageSquare size={16} /> Mở Whiteboard
                </button>
                <button className="btn-outline" onClick={() => setActiveTab('schedule')}>
                  <Calendar size={16} /> Đặt lịch họp
                </button>
              </div>
            </div>
          )}

          {activeTab === 'meeting' && (
            <div className="meeting-tab">
              {!inMeeting ? (
                <div className="meeting-entry">
                  <h3>Cuộc họp — Tạo hoặc tham gia</h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
                    <button className="btn-primary" onClick={startInstantMeeting}>Tạo phòng mới</button>
                    <input
                      type="text"
                      placeholder="Nhập ID cuộc họp để tham gia"
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value)}
                      style={{ padding: 8, flex: 1 }}
                    />
                    <button className="btn-secondary" onClick={joinMeeting} disabled={!meetingId}>Tham gia</button>
                  </div>
                  <p className="hint" style={{ marginTop: 8 }}>ID phòng: {meetingId || '(chưa có)'}</p>
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  <VideoMeetingRoom
                    meetingId={meetingId}
                    userId={userId}
                    userName={userName}
                    userRole="member"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'whiteboard' && (
            <div className="whiteboard-tab">
              {!inWhiteboard ? (
                <div className="wb-entry">
                  <h3>Whiteboard — Mở phòng</h3>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <input
                      type="text"
                      placeholder="Nhập room ID hoặc để trống để tạo mới"
                      value={wbRoom}
                      onChange={(e) => setWbRoom(e.target.value)}
                      style={{ padding: 8, flex: 1 }}
                    />
                    <button className="btn-primary" onClick={openWhiteboard}>Mở Whiteboard</button>
                  </div>
                  <p className="hint" style={{ marginTop: 8 }}>Room: {wbRoom || '(sẽ tạo mới)'}</p>
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  <CollaborativeWhiteboard
                    roomId={`whiteboard-${wbRoom}`}
                    userId={userId}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'meeting' && activeTab !== 'whiteboard' && (
            <div className="system-info">
              <h4>📊 Thông tin hệ thống</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span>API URL:</span>
                  <code>{process.env.REACT_APP_API_URL}</code>
                </div>
                <div className="info-item">
                  <span>Signaling Server:</span>
                  <code>{process.env.REACT_APP_SIGNALING_SERVER}</code>
                </div>
                <div className="info-item">
                  <span>Environment:</span>
                  <span className="badge badge-success">{process.env.REACT_APP_ENVIRONMENT}</span>
                </div>
                <div className="info-item">
                  <span>Version:</span>
                  <span className="badge badge-info">{process.env.REACT_APP_VERSION}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;