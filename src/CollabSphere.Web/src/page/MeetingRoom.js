import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import VideoPlayer from "../components/VideoPlayer";
import MeetingControls from "../components/MeetingControls";

import signalingService from "../services/signalingService";
import whiteboardService from "../services/whiteboardService";

function MeetingRoom() {
  const { id: meetingId } = useParams();

  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  /* =============================
     CONNECT / DISCONNECT SERVICES
     ============================= */
  useEffect(() => {
    if (joined) {
      signalingService.connect(meetingId);
      whiteboardService.connect(meetingId);
    } else {
      signalingService.disconnect();
      whiteboardService.disconnect();
    }

    return () => {
      signalingService.disconnect();
      whiteboardService.disconnect();
    };
  }, [joined, meetingId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* ===== HEADER ===== */}
      <header
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid #333"
        }}
      >
        <h2 style={{ margin: 0 }}>Meeting Room</h2>
        <small>Meeting ID: {meetingId}</small>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main style={{ flex: 1 }}>
        {joined ? (
          <VideoPlayer
            camOn={camOn}
            screenSharing={screenSharing}
          />
        ) : (
          <div
            style={{
              textAlign: "center",
              marginTop: "100px",
              opacity: 0.8
            }}
          >
            <h3>You have not joined the meeting</h3>
            <p>Click "Join Meeting" to start</p>
          </div>
        )}
      </main>

      {/* ===== CONTROLS ===== */}
      <MeetingControls
        joined={joined}
        setJoined={setJoined}
        micOn={micOn}
        setMicOn={setMicOn}
        camOn={camOn}
        setCamOn={setCamOn}
        screenSharing={screenSharing}
        setScreenSharing={setScreenSharing}
      />
    </div>
  );
}

export default MeetingRoom;
