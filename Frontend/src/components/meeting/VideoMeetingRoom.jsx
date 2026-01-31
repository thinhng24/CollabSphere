import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, ScreenShare, Users, MessageSquare } from 'lucide-react';
import './VideoMeetingRoom.css';

const VideoMeetingRoom = ({ meetingId, userId, userName, userRole }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  
  const localVideoRef = useRef(null);
  const screenShareRef = useRef(null);
  // const remoteVideosRef = useRef([]); // Đã xóa vì không sử dụng

  // Định nghĩa startCamera với useCallback
  const startCamera = useCallback(async () => {
    try {
      setIsJoining(true);
      setError(null);
      
      // Kiểm tra quyền truy cập media
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập camera/mic');
      }

      // Yêu cầu quyền truy cập camera và mic
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Kích hoạt video ngay lập tức
        localVideoRef.current.play().catch(e => {
          console.warn('Lỗi phát video:', e);
        });
      }
      
      setCameraStarted(true);
      setIsMuted(false);
      setIsVideoOff(false);
      setIsJoining(false);
      
      // Thêm người dùng hiện tại vào danh sách participants
      setParticipants(prev => [...prev, {
        id: userId,
        name: `${userName} (Bạn)`,
        isMuted: false,
        hasVideo: true,
        isLocal: true
      }]);
      
    } catch (error) {
      console.error('Lỗi khởi tạo meeting:', error);
      let errorMessage = 'Không thể truy cập camera/mic. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Vui lòng cấp quyền truy cập camera và microphone trong trình duyệt.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'Không tìm thấy thiết bị camera/microphone.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Thiết bị đang được sử dụng bởi ứng dụng khác.';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
      setIsJoining(false);
    }
  }, [userId, userName]);

  // Tự động bật camera khi component mount (khi vào meeting)
  useEffect(() => {
    if (!cameraStarted && !isJoining) {
      startCamera();
    }
    
    // Cleanup
    return () => {
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
      }
      if (screenShareRef.current?.srcObject) {
        screenShareRef.current.srcObject.getTracks().forEach(track => track.stop());
        screenShareRef.current.srcObject = null;
      }
    };
  }, [cameraStarted, isJoining, startCamera]);

  const toggleAudio = () => {
    if (!localVideoRef.current?.srcObject) return;
    const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!localVideoRef.current?.srcObject) return;
    const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            displaySurface: "monitor"
          },
          audio: false
        });
        
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = screenStream;
          screenShareRef.current.play().catch(e => {
            console.warn('Lỗi phát màn hình:', e);
          });
        }
        
        setIsScreenSharing(true);
        
        // Khi người dùng dừng chia sẻ màn hình
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (screenShareRef.current) {
            screenShareRef.current.srcObject = null;
          }
        };
      } catch (error) {
        console.error('Lỗi chia sẻ màn hình:', error);
        if (error.name !== 'NotAllowedError') {
          setError('Không thể chia sẻ màn hình: ' + error.message);
        }
      }
    } else {
      if (screenShareRef.current?.srcObject) {
        const tracks = screenShareRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        screenShareRef.current.srcObject = null;
      }
      setIsScreenSharing(false);
    }
  };

  const stopCamera = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (screenShareRef.current?.srcObject) {
      screenShareRef.current.srcObject.getTracks().forEach(track => track.stop());
      screenShareRef.current.srcObject = null;
    }
    setCameraStarted(false);
    setIsScreenSharing(false);
  };

  // Thêm dummy participants để test UI
  useEffect(() => {
    // Thêm một số participants mẫu để test giao diện
    const dummyParticipants = [
      { id: 'user2', name: 'Nguyễn Văn A', isMuted: false, hasVideo: true },
      { id: 'user3', name: 'Trần Thị B', isMuted: true, hasVideo: true },
      { id: 'user4', name: 'Lê Văn C', isMuted: false, hasVideo: false },
    ];
    
    setParticipants(prev => [...prev, ...dummyParticipants.filter(p => 
      !prev.some(existing => existing.id === p.id)
    )]);
    
    // Thêm tin nhắn chat mẫu
    if (chatMessages.length === 0) {
      setChatMessages([
        { sender: 'System', text: 'Chào mừng đến với cuộc họp!', time: '10:00' },
        { sender: 'Nguyễn Văn A', text: 'Xin chào mọi người!', time: '10:01' },
        { sender: 'Trần Thị B', text: 'Mọi người có nghe rõ tôi không?', time: '10:02' },
      ]);
    }
  }, [chatMessages.length]);

  return (
    <div className="video-meeting-container">
      {/* Main Meeting Area */}
      <div className="meeting-main-area">
        {/* Screen Sharing View */}
        {isScreenSharing && (
          <div className="screen-share-container">
            <video
              ref={screenShareRef}
              autoPlay
              playsInline
              className="screen-share-video"
            />
            <div className="screen-share-label">
              <ScreenShare size={16} />
              <span>Đang chia sẻ màn hình</span>
            </div>
          </div>
        )}

        {/* Remote Participants Grid */}
        <div className={`participants-grid ${isScreenSharing ? 'mini-view' : ''}`}>
          {participants.filter(p => !p.isLocal).map((participant, index) => (
            <div key={participant.id} className="participant-video">
              {/* Video placeholder - trong thực tế sẽ là video stream thật */}
              <div className="remote-video" style={{
                backgroundColor: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '14px'
              }}>
                {participant.hasVideo ? (
                  <div style={{ textAlign: 'center' }}>
                    <div>🎥 Video Stream</div>
                    <small>(Kết nối WebRTC sẽ hiển thị ở đây)</small>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div>📷 Camera đang tắt</div>
                    <small>{participant.name.split(' ')[0]}</small>
                  </div>
                )}
              </div>
              <div className="participant-info">
                <span>{participant.name}</span>
                {participant.isMuted && <MicOff size={12} />}
                {!participant.hasVideo && <VideoOff size={12} />}
              </div>
            </div>
          ))}
          
          {/* Hiển thị thông báo khi không có participants khác */}
          {participants.filter(p => !p.isLocal).length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              color: '#999',
              textAlign: 'center',
              padding: '20px'
            }}>
              <Users size={48} />
              <h3>Chỉ có bạn trong phòng</h3>
              <p>Chia sẻ ID phòng để mời người khác tham gia: <strong>{meetingId}</strong></p>
            </div>
          )}
        </div>

        {/* Local Video (PiP) */}
        {cameraStarted && (
          <div className="local-video-pip">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="local-video"
            />
            <div className="local-video-info">
              <span>{userName} {isMuted && '(Đã tắt mic)'} {isVideoOff && '(Đã tắt camera)'}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isJoining && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '20px',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              border: '4px solid #333',
              borderTop: '4px solid #4CAF50',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px'
            }}></div>
            <p>Đang kết nối camera và microphone...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
            <div style={{ marginTop: '10px' }}>
              <button 
                onClick={startCamera}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Thử lại
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="meeting-controls">
        {!cameraStarted ? (
          <button
            className="control-btn"
            onClick={startCamera}
            title="Bắt đầu camera"
            style={{ 
              backgroundColor: '#4CAF50', 
              color: 'white',
              width: 'auto',
              padding: '0 20px',
              borderRadius: '22px'
            }}
            disabled={isJoining}
          >
            {isJoining ? (
              <>
                <div className="spinner-small" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #fff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  display: 'inline-block',
                  marginRight: '8px'
                }}></div>
                Đang kết nối...
              </>
            ) : (
              <>
                <Video size={20} />
                Bắt đầu camera
              </>
            )}
          </button>
        ) : (
          <>
            <button
              className={`control-btn ${isMuted ? 'active' : ''}`}
              onClick={toggleAudio}
              title={isMuted ? 'Bật mic' : 'Tắt mic'}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button
              className={`control-btn ${isVideoOff ? 'active' : ''}`}
              onClick={toggleVideo}
              title={isVideoOff ? 'Bật camera' : 'Tắt camera'}
            >
              {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>

            <button
              className={`control-btn ${isScreenSharing ? 'active' : ''}`}
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
              disabled={!cameraStarted}
            >
              <ScreenShare size={20} />
            </button>

            <button
              className="control-btn"
              onClick={() => setShowParticipants(!showParticipants)}
              title="Danh sách người tham gia"
            >
              <Users size={20} />
              <span className="badge">{participants.length}</span>
            </button>

            <button
              className="control-btn"
              onClick={() => setShowChat(!showChat)}
              title="Chat"
            >
              <MessageSquare size={20} />
            </button>

            <button
              className="control-btn danger"
              onClick={stopCamera}
              title="Rời khỏi cuộc họp"
            >
              <Phone size={20} style={{ transform: 'rotate(135deg)' }} />
            </button>
          </>
        )}
      </div>

      {/* Side Panels */}
      {(showParticipants || showChat) && (
        <div className="side-panels">
          {showParticipants && (
            <div className="participants-panel">
              <h3>Người tham gia ({participants.length})</h3>
              <div className="participants-list">
                <div className="participant-item local">
                  <span>{userName} (Bạn)</span>
                  <div className="status-indicators">
                    {isMuted && <MicOff size={14} />}
                    {isVideoOff && <VideoOff size={14} />}
                  </div>
                </div>
                {participants.filter(p => !p.isLocal).map(participant => (
                  <div key={participant.id} className="participant-item">
                    <span>{participant.name}</span>
                    <div className="status-indicators">
                      {participant.isMuted && <MicOff size={14} />}
                      {!participant.hasVideo && <VideoOff size={14} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showChat && (
            <div className="chat-panel">
              <h3>Chat</h3>
              <div className="chat-messages">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="chat-message">
                    <strong>{msg.sender}: </strong>
                    <span>{msg.text}</span>
                    <small>{msg.time}</small>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target;
                      if (input.value.trim()) {
                        setChatMessages(prev => [...prev, {
                          sender: userName,
                          text: input.value,
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }]);
                        input.value = '';
                      }
                    }
                  }}
                />
                <button onClick={(e) => {
                  const input = e.target.previousElementSibling;
                  if (input.value.trim()) {
                    setChatMessages(prev => [...prev, {
                      sender: userName,
                      text: input.value,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);
                    input.value = '';
                  }
                }}>Gửi</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meeting Info */}
      <div className="meeting-info">
        <div className="meeting-id">
          <span>ID cuộc họp: {meetingId}</span>
          <button onClick={() => {
            navigator.clipboard.writeText(meetingId);
            alert('Đã sao chép ID cuộc họp!');
          }}>
            Sao chép
          </button>
        </div>
        <div className="timer">00:00:00</div>
      </div>
      
      {/* Thêm CSS animation cho spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VideoMeetingRoom;