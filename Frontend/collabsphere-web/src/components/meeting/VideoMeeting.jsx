import React, { useRef, useState, useEffect } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import './VideoMeeting.css';

const VideoMeeting = ({ meetingId, user }) => {
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const [localStream, setLocalStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [connection, setConnection] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);

  const peerConnections = useRef({});

  // 1. Khởi tạo kết nối
  useEffect(() => {
    initializeMeeting();
    return () => cleanup();
  }, []);

  const initializeMeeting = async () => {
    try {
      // Lấy stream camera và mic
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Kết nối đến signaling server
      const conn = new HubConnectionBuilder()
        .withUrl(`${process.env.REACT_APP_API_URL}/hubs/webrtc`, {
          accessTokenFactory: () => localStorage.getItem('token')
        })
        .withAutomaticReconnect()
        .build();

      // Xử lý sự kiện từ server
      conn.on('UserJoined', handleUserJoined);
      conn.on('UserLeft', handleUserLeft);
      conn.on('ReceiveOffer', handleReceiveOffer);
      conn.on('ReceiveAnswer', handleReceiveAnswer);
      conn.on('ReceiveIceCandidate', handleReceiveIceCandidate);

      await conn.start();
      await conn.invoke('JoinMeeting', meetingId, user.id, user.name);
      
      setConnection(conn);
      setIsConnecting(false);
      
    } catch (err) {
      console.error('Lỗi khởi tạo cuộc họp:', err);
      setError('Không thể kết nối đến cuộc họp');
    }
  };

  // 2. Xử lý khi có người tham gia
  const handleUserJoined = async (newUser) => {
    if (newUser.userId === user.id) return;
    
    console.log(`${newUser.userName} đã tham gia`);
    
    // Thêm vào danh sách người tham gia
    setParticipants(prev => [...prev, {
      id: newUser.userId,
      name: newUser.userName,
      isAudioMuted: false,
      isVideoOff: false
    }]);

    // Tạo peer connection mới
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Thêm stream local
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Xử lý ICE candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && connection) {
        connection.invoke('SendIceCandidate', meetingId, newUser.userId, event.candidate);
      }
    };

    // Xử lý stream từ xa
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      remoteVideosRef.current[newUser.userId] = stream;
      updateRemoteVideo(newUser.userId, stream);
    };

    peerConnections.current[newUser.userId] = pc;

    // Tạo và gửi offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await connection.invoke('SendOffer', meetingId, newUser.userId, offer);
    } catch (err) {
      console.error('Lỗi tạo offer:', err);
    }
  };

  // 3. Xử lý khi người rời
  const handleUserLeft = (leftUser) => {
    console.log(`${leftUser.userId} đã rời`);
    setParticipants(prev => prev.filter(p => p.id !== leftUser.userId));
    
    // Đóng peer connection
    const pc = peerConnections.current[leftUser.userId];
    if (pc) {
      pc.close();
      delete peerConnections.current[leftUser.userId];
    }
    
    // Xóa video
    delete remoteVideosRef.current[leftUser.userId];
  };

  // 4. Các hàm xử lý WebRTC
  const handleReceiveOffer = async (data) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && connection) {
        connection.invoke('SendIceCandidate', meetingId, data.fromUserId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      remoteVideosRef.current[data.fromUserId] = stream;
      updateRemoteVideo(data.fromUserId, stream);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    await connection.invoke('SendAnswer', meetingId, data.fromUserId, answer);
    
    peerConnections.current[data.fromUserId] = pc;
  };

  const handleReceiveAnswer = async (data) => {
    const pc = peerConnections.current[data.fromUserId];
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  };

  const handleReceiveIceCandidate = async (data) => {
    const pc = peerConnections.current[data.fromUserId];
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  };

  // 5. Cập nhật video từ xa
  const updateRemoteVideo = (userId, stream) => {
    const videoElement = document.getElementById(`remote-video-${userId}`);
    if (videoElement) {
      videoElement.srcObject = stream;
    }
  };

  // 6. Các nút điều khiển
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Thay thế track video trong tất cả các peer connection
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });
        
        // Khi người dùng dừng chia sẻ
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
      } else {
        // Quay lại camera
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraTrack);
          }
        });
        
        cameraStream.getTracks()[0].stop();
        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error('Lỗi chia sẻ màn hình:', err);
    }
  };

  // 7. Rời cuộc họp
  const leaveMeeting = async () => {
    try {
      if (connection) {
        await connection.invoke('LeaveMeeting', meetingId, user.id);
        await connection.stop();
      }
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      Object.values(peerConnections.current).forEach(pc => pc.close());
      
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Lỗi khi rời cuộc họp:', err);
    }
  };

  // 8. Dọn dẹp
  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    Object.values(peerConnections.current).forEach(pc => pc.close());
    if (connection) {
      connection.stop();
    }
  };

  if (error) {
    return (
      <div className="meeting-error">
        <h3>⚠️ Lỗi kết nối</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Thử lại</button>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="meeting-loading">
        <div className="spinner"></div>
        <p>Đang kết nối đến cuộc họp...</p>
      </div>
    );
  }

  return (
    <div className="video-meeting">
      {/* Header */}
      <div className="meeting-header">
        <div className="meeting-info">
          <h3>Cuộc họp: {meetingId}</h3>
          <p className="participant-count">👥 {participants.length + 1} người tham gia</p>
        </div>
        <button className="leave-button" onClick={leaveMeeting}>
          📞 Rời cuộc họp
        </button>
      </div>

      {/* Video Grid */}
      <div className="video-grid">
        {/* Video của bạn */}
        <div className="video-container local">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            className={isVideoOff ? 'video-off' : ''}
          />
          <div className="video-overlay">
            <span className="user-name">{user.name} (Bạn)</span>
            <div className="status-icons">
              {isAudioMuted && <span className="icon">🔇</span>}
              {isVideoOff && <span className="icon">📷❌</span>}
              {isScreenSharing && <span className="icon">🖥️</span>}
            </div>
          </div>
        </div>

        {/* Video của người khác */}
        {participants.map(participant => (
          <div key={participant.id} className="video-container remote">
            <video 
              id={`remote-video-${participant.id}`}
              autoPlay 
              className={participant.isVideoOff ? 'video-off' : ''}
            />
            <div className="video-overlay">
              <span className="user-name">{participant.name}</span>
              <div className="status-icons">
                {participant.isAudioMuted && <span className="icon">🔇</span>}
                {participant.isVideoOff && <span className="icon">📷❌</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="controls">
        <button 
          className={`control-button ${isAudioMuted ? 'active' : ''}`}
          onClick={toggleAudio}
          title={isAudioMuted ? "Bật mic" : "Tắt mic"}
        >
          {isAudioMuted ? '🔇 Mic' : '🎤 Mic'}
        </button>
        
        <button 
          className={`control-button ${isVideoOff ? 'active' : ''}`}
          onClick={toggleVideo}
          title={isVideoOff ? "Bật camera" : "Tắt camera"}
        >
          {isVideoOff ? '📷❌ Camera' : '📹 Camera'}
        </button>
        
        <button 
          className={`control-button ${isScreenSharing ? 'active' : ''}`}
          onClick={toggleScreenShare}
          title={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
        >
          {isScreenSharing ? '🖥️⏹️ Chia sẻ' : '🖥️ Chia sẻ'}
        </button>
        
        <button 
          className="control-button participants-button"
          onClick={() => document.querySelector('.participants-list').classList.toggle('show')}
        >
          👥 Danh sách ({participants.length + 1})
        </button>
      </div>

      {/* Participants List */}
      <div className="participants-list">
        <h4>Người tham gia</h4>
        <ul>
          <li className="current-user">
            <span>{user.name} (Bạn)</span>
            <div className="user-status">
              {isAudioMuted && <span>🔇</span>}
              {isVideoOff && <span>📷❌</span>}
            </div>
          </li>
          {participants.map(p => (
            <li key={p.id}>
              <span>{p.name}</span>
              <div className="user-status">
                {p.isAudioMuted && <span>🔇</span>}
                {p.isVideoOff && <span>📷❌</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VideoMeeting;