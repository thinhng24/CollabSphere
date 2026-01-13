import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ScheduleMeeting.css';

const ScheduleMeeting = ({ teamId, onScheduleSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    agenda: '',
    participants: [],
    recurrence: 'none' // none, daily, weekly, monthly
  });

  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lấy danh sách thành viên team
  useEffect(() => {
    fetchTeamMembers();
  }, [teamId]);

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/teams/${teamId}/members`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTeamMembers(response.data);
    } catch (err) {
      console.error('Lỗi tải thành viên:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const participantId = value;
      setFormData(prev => ({
        ...prev,
        participants: checked
          ? [...prev.participants, participantId]
          : prev.participants.filter(id => id !== participantId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDateTimeChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề cuộc họp');
      return false;
    }
    
    if (!formData.startTime) {
      setError('Vui lòng chọn thời gian bắt đầu');
      return false;
    }
    
    if (!formData.endTime) {
      setError('Vui lòng chọn thời gian kết thúc');
      return false;
    }
    
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    
    if (start >= end) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu');
      return false;
    }
    
    if (start < new Date()) {
      setError('Thời gian bắt đầu phải ở tương lai');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const meetingData = {
        ...formData,
        teamId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString()
      };
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/meetings`,
        meetingData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess('Đã đặt lịch họp thành công!');
      setFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        agenda: '',
        participants: [],
        recurrence: 'none'
      });
      
      if (onScheduleSuccess) {
        onScheduleSuccess(response.data);
      }
      
      // Gửi email thông báo
      await sendMeetingNotifications(response.data.id);
      
    } catch (err) {
      console.error('Lỗi đặt lịch họp:', err);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đặt lịch họp');
    } finally {
      setLoading(false);
    }
  };

  const sendMeetingNotifications = async (meetingId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/meetings/${meetingId}/notify`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (err) {
      console.error('Lỗi gửi thông báo:', err);
    }
  };

  const generateMeetingLink = () => {
    const randomId = Math.random().toString(36).substring(7);
    return `${window.location.origin}/meet/${randomId}`;
  };

  // Tính toán thời gian đề xuất
  const getSuggestedTimes = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9:00 AM ngày mai
    
    const options = [
      {
        label: '9:00 AM ngày mai',
        value: tomorrow.toISOString().slice(0, 16),
        end: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) // +1 giờ
      },
      {
        label: '2:00 PM ngày mai',
        value: new Date(tomorrow.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 16),
        end: new Date(tomorrow.getTime() + 6 * 60 * 60 * 1000).toISOString().slice(0, 16)
      },
      {
        label: '10:00 AM ngày kia',
        value: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        end: new Date(tomorrow.getTime() + 25 * 60 * 60 * 1000).toISOString().slice(0, 16)
      }
    ];
    
    return options;
  };

  return (
    <div className="schedule-meeting">
      <div className="schedule-header">
        <h2>📅 Đặt lịch họp mới</h2>
        <p>Lên lịch cho cuộc họp team của bạn</p>
      </div>

      <form onSubmit={handleSubmit} className="schedule-form">
        {/* Thông tin cơ bản */}
        <div className="form-section">
          <h3>Thông tin cuộc họp</h3>
          
          <div className="form-group">
            <label htmlFor="title">Tiêu đề cuộc họp *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ví dụ: Họp tiến độ dự án XYZ"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả ngắn về cuộc họp..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="agenda">Chương trình nghị sự</label>
            <textarea
              id="agenda"
              name="agenda"
              value={formData.agenda}
              onChange={handleChange}
              placeholder="1. Điểm danh...&#10;2. Tiến độ dự án...&#10;3. Thảo luận vấn đề..."
              rows="5"
            />
          </div>
        </div>

        {/* Thời gian */}
        <div className="form-section">
          <h3>Thời gian</h3>
          
          <div className="time-grid">
            <div className="form-group">
              <label htmlFor="startTime">Thời gian bắt đầu *</label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={(e) => handleDateTimeChange('startTime', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">Thời gian kết thúc *</label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={(e) => handleDateTimeChange('endTime', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="suggested-times">
            <p>Thời gian đề xuất:</p>
            <div className="time-suggestions">
              {getSuggestedTimes().map((time, index) => (
                <button
                  key={index}
                  type="button"
                  className="time-suggestion"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      startTime: time.value,
                      endTime: time.end
                    }));
                  }}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="recurrence">Lặp lại</label>
            <select
              id="recurrence"
              name="recurrence"
              value={formData.recurrence}
              onChange={handleChange}
            >
              <option value="none">Không lặp lại</option>
              <option value="daily">Hàng ngày</option>
              <option value="weekly">Hàng tuần</option>
              <option value="monthly">Hàng tháng</option>
            </select>
          </div>
        </div>

        {/* Thành viên */}
        <div className="form-section">
          <h3>Thành viên tham dự</h3>
          
          <div className="participants-list">
            {teamMembers.map(member => (
              <div key={member.id} className="participant-item">
                <input
                  type="checkbox"
                  id={`member-${member.id}`}
                  value={member.id}
                  checked={formData.participants.includes(member.id)}
                  onChange={handleChange}
                />
                <label htmlFor={`member-${member.id}`}>
                  <div className="member-info">
                    <div className="member-avatar">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>{member.name}</strong>
                      <p>{member.email}</p>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          <div className="select-all">
            <input
              type="checkbox"
              id="selectAll"
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  participants: e.target.checked 
                    ? teamMembers.map(m => m.id) 
                    : []
                }));
              }}
              checked={formData.participants.length === teamMembers.length}
            />
            <label htmlFor="selectAll">Chọn tất cả thành viên</label>
          </div>
        </div>

        {/* Thông báo */}
        <div className="form-section">
          <h3>Thông báo</h3>
          <div className="notification-settings">
            <label className="notification-option">
              <input type="checkbox" defaultChecked />
              <span>Gửi email mời họp</span>
            </label>
            <label className="notification-option">
              <input type="checkbox" defaultChecked />
              <span>Nhắc nhở 15 phút trước</span>
            </label>
            <label className="notification-option">
              <input type="checkbox" defaultChecked />
              <span>Nhắc nhở 1 giờ trước</span>
            </label>
          </div>
        </div>

        {/* Thông tin link */}
        <div className="meeting-link-preview">
          <h4>📎 Link cuộc họp sẽ là:</h4>
          <code>{generateMeetingLink()}</code>
          <p className="note">Link này sẽ được gửi đến tất cả người tham gia</p>
        </div>

        {/* Thông báo lỗi/thành công */}
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        {/* Nút hành động */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => window.history.back()}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : '📅 Đặt lịch họp'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleMeeting;