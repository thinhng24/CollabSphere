// src/components/VideoMeeting.js
import React, { useRef, useEffect, useState } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';

const SIGNALING_SERVER_URL = 'http://localhost:3001'; // Replace with your backend Socket.IO URL

const VideoMeeting = ({ roomId }) => {
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [joined, setJoined] = useState(false);
  const myVideo = useRef();
  const socket = useRef();

  useEffect(() => {
    socket.current = io(SIGNALING_SERVER_URL);

    socket.current.on('signal', ({ from, signal }) => {
      if (peers[from]) {
        peers[from].signal(signal);
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, [peers]);

  const joinMeeting = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(mediaStream);
    myVideo.current.srcObject = mediaStream;
    setJoined(true);

    socket.current.emit('join-room', roomId);

    socket.current.on('user-joined', (userId) => {
      const peer = new Peer({ initiator: true, trickle: false, stream: mediaStream });
      peer.on('signal', (signal) => {
        socket.current.emit('signal', { to: userId, signal });
      });
      setPeers((prev) => ({ ...prev, [userId]: peer }));
    });

    socket.current.on('signal', ({ from, signal }) => {
      if (peers[from]) {
        peers[from].signal(signal);
      }
    });
  };

  const leaveMeeting = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setJoined(false);
    Object.values(peers).forEach(peer => peer.destroy());
    setPeers({});
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !micOn;
      setMicOn(!micOn);
    }
  };

  const toggleCam = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !camOn;
      setCamOn(!camOn);
    }
  };

  return (
    <div>
      <h2>Video Meeting</h2>
      <video ref={myVideo} autoPlay muted style={{ width: '300px' }} />
      {Object.keys(peers).map((peerId) => (
        <video key={peerId} autoPlay style={{ width: '300px' }} />
      ))}
      {!joined ? (
        <button onClick={joinMeeting}>Join Meeting</button>
      ) : (
        <div>
          <button onClick={toggleMic}>{micOn ? 'Mute Mic' : 'Unmute Mic'}</button>
          <button onClick={toggleCam}>{camOn ? 'Turn Off Cam' : 'Turn On Cam'}</button>
          <button onClick={leaveMeeting}>Leave Meeting</button>
        </div>
      )}
    </div>
  );
};

export default VideoMeeting;