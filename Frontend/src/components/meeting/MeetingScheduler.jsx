import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Calendar, Clock, Users, Video, FileText,
  Bell, Repeat, Send, X, Check
} from 'lucide-react';

const MeetingScheduler = ({ teamId, teamMembers, onSchedule }) => {
  const [meetingData, setMeetingData] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3600000), // 1 hour later
    participants: [],
    teamId: teamId,
    agenda: '',
    recurrence: 'none',
    reminder: 15, // minutes
    meetingType: 'video',
    resources: []
  });

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  // Kiểm tra conflict
  useEffect(() => {
    if (meetingData.startDate && meetingData.endDate) {
      checkConflicts();
    }
  }, [meetingData.startDate, meetingData.endDate, selectedMembers]);

  const checkConflicts = async () => {
    try {
      const response = await fetch(`/api/meetings/check-conflicts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: meetingData.startDate,
          endTime: meetingData.endDate,
          participants: selectedMembers.map(m => m.id)
        })
      });
      
      const data = await response.json();
      setConflicts(data.conflicts || []);
      setAvailableRooms(data.availableRooms || []);
    } catch (error) {
      console.error('Lỗi kiểm tra conflict:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const finalData = {
      ...meetingData,
      participants: selectedMembers,
      organizerId: localStorage.getItem('userId')
    };

    try {
      const response = await fetch('/api/meetings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Gửi notifications
        sendNotifications(result.meetingId);
        
        // Gọi callback
        onSchedule && onSchedule(result);
        
        alert('Đã lên lịch cuộc họp thành công!');
        resetForm();
      }
    } catch (error) {
      console.error('Lỗi lên lịch:', error);
      alert('Có lỗi xảy ra khi lên lịch cuộc họp');
    }
  };

  const sendNotifications = (meetingId) => {
    // Gửi email notifications
    selectedMembers.forEach(member => {
      fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: member.email,
          subject: `Cuộc họp mới: ${meetingData.title}`,
          meetingId,
          startTime: meetingData.startDate,
          joinLink: `${window.location.origin}/meeting/${meetingId}`
        })
      });
    });

    // Gửi real-time notifications
    fetch('/api/notifications/realtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIds: selectedMembers.map(m => m.id),
        type: 'meeting_scheduled',
        title: 'Cuộc họp mới',
        message: `Bạn có cuộc họp "${meetingData.title}" vào lúc ${formatTime(meetingData.startDate)}`,
        meetingId
      })
    });
  };

  const resetForm = () => {
    setMeetingData({
      title: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000),
      participants: [],
      agenda: '',
      recurrence: 'none',
      reminder: 15,
      meetingType: 'video',
      resources: []
    });
    setSelectedMembers([]);
  };

  const formatTime = (date) => {
    return date.toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const recurrenceOptions = [
    { value: 'none', label: 'Không lặp lại' },
    { value: 'daily', label: 'Hàng ngày' },
    { value: 'weekly', label: 'Hàng tuần' },
    { value: 'monthly', label: 'Hàng tháng' }
  ];

  const reminderOptions = [
    { value: 5, label: '5 phút trước' },
    { value: 15, label: '15 phút trước' },
    { value: 30, label: '30 phút trước' },
    { value: 60, label: '1 giờ trước' },
    { value: 1440, label: '1 ngày trước' }
  ];

  const meetingTypes = [
    { value: 'video', label: 'Video Call', icon: <Video size={16} /> },
    { value: 'audio', label: 'Audio Only', icon: <Users size={16} /> },
    { value: 'hybrid', label: 'Hybrid', icon: <Video size={16} /> }
  ];

  return (
    <div className="scheduler-container">
      <div className="scheduler-header">
        <Calendar size={24} />
        <h2>Đặt lịch họp nhóm</h2>
      </div>

      <form onSubmit={handleSubmit} className="scheduler-form">
        <div className="form-section">
          <div className="form-group">
            <label>
              <Video size={16} />
              Tiêu đề cuộc họp *
            </label>
            <input
              type="text"
              value={meetingData.title}
              onChange={(e) => setMeetingData({
                ...meetingData,
                title: e.target.value
              })}
              placeholder="Nhập tiêu đề cuộc họp"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <FileText size={16} />
              Mô tả
            </label>
            <textarea
              value={meetingData.description}
              onChange={(e) => setMeetingData({
                ...meetingData,
                description: e.target.value
              })}
              placeholder="Mô tả về cuộc họp..."
              rows={3}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label>
                <Calendar size={16} />
                Ngày bắt đầu *
              </label>
              <DatePicker
                selected={meetingData.startDate}
                onChange={(date) => setMeetingData({
                  ...meetingData,
                  startDate: date
                })}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                minDate={new Date()}
                className="date-picker"
              />
            </div>

            <div className="form-group">
              <label>
                <Clock size={16} />
                Ngày kết thúc *
              </label>
              <DatePicker
                selected={meetingData.endDate}
                onChange={(date) => setMeetingData({
                  ...meetingData,
                  endDate: date
                })}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                minDate={meetingData.startDate}
                className="date-picker"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <Repeat size={16} />
                Lặp lại
              </label>
              <select
                value={meetingData.recurrence}
                onChange={(e) => setMeetingData({
                  ...meetingData,
                  recurrence: e.target.value
                })}
              >
                {recurrenceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <Bell size={16} />
                Nhắc nhở
              </label>
              <select
                value={meetingData.reminder}
                onChange={(e) => setMeetingData({
                  ...meetingData,
                  reminder: parseInt(e.target.value)
                })}
              >
                {reminderOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label>
              <Users size={16} />
              Thành viên tham gia *
            </label>
            <div className="members-selector">
              <div className="available-members">
                {teamMembers.map(member => (
                  <div
                    key={member.id}
                    className={`member-chip ${selectedMembers.some(m => m.id === member.id) ? 'selected' : ''}`}
                    onClick={() => {
                      if (selectedMembers.some(m => m.id === member.id)) {
                        setSelectedMembers(
                          selectedMembers.filter(m => m.id !== member.id)
                        );
                      } else {
                        setSelectedMembers([...selectedMembers, member]);
                      }
                    }}
                  >
                    <img
                      src={member.avatar || '/default-avatar.png'}
                      alt={member.name}
                      className="member-avatar"
                    />
                    <span>{member.name}</span>
                    {selectedMembers.some(m => m.id === member.id) && (
                      <Check size={14} />
                    )}
                  </div>
                ))}
              </div>
              <div className="selected-members">
                <h4>Đã chọn ({selectedMembers.length})</h4>
                {selectedMembers.map(member => (
                  <div key={member.id} className="selected-member">
                    <span>{member.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedMembers(
                        selectedMembers.filter(m => m.id !== member.id)
                      )}
                      className="remove-btn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label>Loại cuộc họp</label>
            <div className="meeting-type-selector">
              {meetingTypes.map(type => (
                <div
                  key={type.value}
                  className={`type-option ${meetingData.meetingType === type.value ? 'selected' : ''}`}
                  onClick={() => setMeetingData({
                    ...meetingData,
                    meetingType: type.value
                  })}
                >
                  {type.icon}
                  <span>{type.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Chương trình nghị sự</label>
            <textarea
              value={meetingData.agenda}
              onChange={(e) => setMeetingData({
                ...meetingData,
                agenda: e.target.value
              })}
              placeholder="1. Điểm thứ nhất...
2. Điểm thứ hai..."
              rows={4}
            />
          </div>
        </div>

        {/* Conflict Warning */}
        {conflicts.length > 0 && (
          <div className="conflict-warning">
            <h4>⚠️ Có xung đột lịch trình:</h4>
            <ul>
              {conflicts.map((conflict, index) => (
                <li key={index}>
                  {conflict.memberName} có cuộc họp "{conflict.meetingTitle}"
                  từ {formatTime(new Date(conflict.startTime))}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Available Rooms */}
        {availableRooms.length > 0 && (
          <div className="rooms-available">
            <h4>Phòng họp khả dụng:</h4>
            <div className="room-list">
              {availableRooms.map(room => (
                <div key={room.id} className="room-item">
                  <Video size={16} />
                  <span>{room.name} ({room.capacity} người)</span>
                  <button
                    type="button"
                    onClick={() => setMeetingData({
                      ...meetingData,
                      roomId: room.id
                    })}
                    className="select-room-btn"
                  >
                    Chọn
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={resetForm}
            className="btn-secondary"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!meetingData.title || !selectedMembers.length}
          >
            <Send size={16} />
            Đặt lịch họp
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeetingScheduler;