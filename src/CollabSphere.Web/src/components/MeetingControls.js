import React, { useState } from "react";
import "./MeetingControls.css";

const MeetingControls = () => {
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  const handleJoin = () => {
    setJoined(true);
  };

  const handleLeave = () => {
    setJoined(false);
    setMicOn(true);
    setCamOn(true);
    setScreenSharing(false);
  };

  return (
    <div className="meeting-controls">
      {!joined ? (
        <button className="btn join" onClick={handleJoin}>
          Join Meeting
        </button>
      ) : (
        <>
          <button
            className={`btn ${micOn ? "active" : "off"}`}
            onClick={() => setMicOn(!micOn)}
          >
            {micOn ? "Mic On" : "Mic Off"}
          </button>

          <button
            className={`btn ${camOn ? "active" : "off"}`}
            onClick={() => setCamOn(!camOn)}
          >
            {camOn ? "Cam On" : "Cam Off"}
          </button>

          <button
            className={`btn ${screenSharing ? "active" : ""}`}
            onClick={() => setScreenSharing(!screenSharing)}
          >
            {screenSharing ? "Stop Share" : "Share Screen"}
          </button>

          <button className="btn leave" onClick={handleLeave}>
            Leave
          </button>
        </>
      )}
    </div>
  );
};

export default MeetingControls;
