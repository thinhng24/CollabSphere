import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function App() {
  const navigate = useNavigate();

  const handleCreateMeeting = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/meeting/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();
      navigate(`/meeting/${data.meetingId}`);
    } catch (error) {
      console.error(error);
      alert("Create meeting failed");
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>CollabSphere</h1>
        <p>Online Collaboration Platform</p>
      </header>

      <main className="main">
        <div className="card">
          <h2>Meeting Room</h2>
          <p>Create or join an online meeting room.</p>

          <button className="btn primary" onClick={handleCreateMeeting}>
            Create Meeting
          </button>

          <button className="btn secondary">
            Join Meeting
          </button>
        </div>

        <div className="card">
          <h2>Whiteboard</h2>
          <p>Collaborate with your team in real-time.</p>
          <button className="btn primary">Open Whiteboard</button>
        </div>
      </main>

      <footer className="footer">
        <p>© 2026 CollabSphere</p>
      </footer>
    </div>
  );
}

export default App;
