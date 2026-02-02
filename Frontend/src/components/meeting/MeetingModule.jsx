import React, { useState } from 'react';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@reach/tabs';
import {
  Video, Calendar, Edit3, Share2,
  Users, Clock, Bell
} from 'lucide-react';
import '@reach/tabs/styles.css';

const MeetingModule = ({ teamId, teamName, teamMembers }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);

  const startInstantMeeting = () => {
    const meetingId = generateMeetingId();
    window.open(`/meeting/${meetingId}`, '_blank');
  };

  const generateMeetingId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  return (
    <div className="meeting-module">
      {/* Header */}
      <div className="module-header">
        <div className="header-left">
          <Video size={32} />
          <div>
            <h1>Phòng họp nhóm: {teamName}</h1>
            <p>ID nhóm: {teamId} • {teamMembers.length} thành viên</p>
          </div>
        </div>
        <div className="header-right">
          <button
            className="instant-meeting-btn"
            onClick={startInstantMeeting}
          >
            <Video size={20} />
            Bắt đầu cuộc họp ngay
          </button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        className="meeting-tabs"
        onChange={setActiveTab}
        index={activeTab}
      >
        <TabList>
          <Tab>
            <Video size={18} />
            <span>Cuộc họp</span>
          </Tab>
          <Tab>
            <Calendar size={18} />
            <span>Lịch họp</span>
          </Tab>
          <Tab>
            <Edit3 size={18} />
            <span>Whiteboard</span>
          </Tab>
          <Tab>
            <Users size={18} />
            <span>Thành viên</span>
          </Tab>
          <Tab>
            <Clock size={18} />
            <span>Lịch sử</span>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Tab 1: Video Meeting */}
          <TabPanel>
            <div className="tab-content">
              <div className="meeting-controls-card">
                <h3>Cuộc họp video</h3>
                <div className="control-options">
                  <div className="control-option">
                    <div className="option-icon">
                      <Video size={24} />
                    </div>
                    <div className="option-content">
                      <h4>Cuộc họp mới</h4>
                      <p>Tạo phòng họp video mới với âm thanh HD</p>
                    </div>
                    <button
                      className="option-btn"
                      onClick={startInstantMeeting}
                    >
                      Bắt đầu
                    </button>
                  </div>

                  <div className="control-option">
                    <div className="option-icon">
                      <Share2 size={24} />
                    </div>
                    <div className="option-content">
                      <h4>Chia sẻ màn hình</h4>
                      <p>Chia sẻ toàn bộ màn hình hoặc cửa sổ ứng dụng</p>
                    </div>
                    <button className="option-btn">
                      Chia sẻ
                    </button>
                  </div>

                  <div className="control-option">
                    <div className="option-icon">
                      <Bell size={24} />
                    </div>
                    <div className="option-content">
                      <h4>Cuộc họp sắp diễn ra</h4>
                      <p>Xem các cuộc họp đã được lên lịch</p>
                    </div>
                    <button
                      className="option-btn"
                      onClick={() => setActiveTab(1)}
                    >
                      Xem lịch
                    </button>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h4>Hành động nhanh</h4>
                <div className="action-buttons">
                  <button className="action-btn">
                    <Video size={16} />
                    <span>Ghi hình cuộc họp</span>
                  </button>
                  <button className="action-btn">
                    <Edit3 size={16} />
                    <span>Mở whiteboard</span>
                  </button>
                  <button className="action-btn">
                    <Users size={16} />
                    <span>Mời thành viên</span>
                  </button>
                  <button className="action-btn">
                    <Clock size={16} />
                    <span>Đặt lịch họp</span>
                  </button>
                </div>
              </div>
            </div>
          </TabPanel>

          {/* Tab 2: Meeting Scheduler */}
          <TabPanel>
            <MeetingScheduler
              teamId={teamId}
              teamMembers={teamMembers}
              onSchedule={(meeting) => {
                setUpcomingMeetings([...upcomingMeetings, meeting]);
                setActiveTab(3); // Switch to meetings tab
              }}
            />
          </TabPanel>

          {/* Tab 3: Whiteboard */}
          <TabPanel>
            <div className="whiteboard-tab">
              <div className="whiteboard-header">
                <h3>Whiteboard cộng tác thời gian thực</h3>
                <div className="whiteboard-actions">
                  <button className="btn-secondary">
                    <Share2 size={16} />
                    Chia sẻ
                  </button>
                  <button className="btn-primary">
                    <Edit3 size={16} />
                    Mở Whiteboard
                  </button>
                </div>
              </div>
              <CollaborativeWhiteboard
                roomId={`whiteboard-${teamId}`}
                userId={localStorage.getItem('userId')}
              />
            </div>
          </TabPanel>

          {/* Tab 4: Members */}
          <TabPanel>
            <div className="members-tab">
              <h3>Thành viên nhóm ({teamMembers.length})</h3>
              <div className="members-grid">
                {teamMembers.map(member => (
                  <div key={member.id} className="member-card">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="member-avatar-lg"
                    />
                    <div className="member-info">
                      <h4>{member.name}</h4>
                      <p>{member.role}</p>
                      <span className="member-status online">
                        Đang hoạt động
                      </span>
                    </div>
                    <div className="member-actions">
                      <button className="icon-btn">
                        <Video size={16} />
                      </button>
                      <button className="icon-btn">
                        <Users size={16} />
                      </button>
                      <button className="icon-btn">
                        <Bell size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabPanel>

          {/* Tab 5: Meeting History */}
          <TabPanel>
            <div className="history-tab">
              <h3>Lịch sử cuộc họp</h3>
              <div className="meetings-list">
                {upcomingMeetings.map(meeting => (
                  <div key={meeting.id} className="meeting-item">
                    <div className="meeting-date">
                      <div className="date-badge">
                        {new Date(meeting.startDate).getDate()}
                      </div>
                      <div className="date-month">
                        Tháng {new Date(meeting.startDate).getMonth() + 1}
                      </div>
                    </div>
                    <div className="meeting-details">
                      <h4>{meeting.title}</h4>
                      <p>{meeting.description}</p>
                      <div className="meeting-meta">
                        <span>
                          <Clock size={12} />
                          {new Date(meeting.startDate).toLocaleTimeString()}
                          {' - '}
                          {new Date(meeting.endDate).toLocaleTimeString()}
                        </span>
                        <span>
                          <Users size={12} />
                          {meeting.participants?.length || 0} người tham gia
                        </span>
                      </div>
                    </div>
                    <div className="meeting-actions">
                      <button className="action-btn">
                        Xem lại
                      </button>
                      <button className="action-btn">
                        Sao chép link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

export default MeetingModule;