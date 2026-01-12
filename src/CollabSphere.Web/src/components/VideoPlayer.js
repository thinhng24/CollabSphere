import React from "react";
import "./VideoPlayer.css";

const VideoPlayer = ({ camOn, screenSharing }) => {
  return (
    <div className="video-area">
      {/* Local video */}
      <div className="video-box local">
        {camOn ? (
          <div className="video-placeholder">
            <span>🎥 Your Camera</span>
          </div>
        ) : (
          <div className="video-off">
            <span>Camera Off</span>
          </div>
        )}
      </div>

      {/* Screen sharing */}
      {screenSharing && (
        <div className="video-box screen">
          <div className="video-placeholder">
            <span>🖥 Screen Sharing</span>
          </div>
        </div>
      )}

      {/* Remote user (mock) */}
      <div className="video-box remote">
        <div className="video-placeholder">
          <span>👤 Teammate</span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
