// src/services/whiteboardService.js

class WhiteboardService {
  constructor() {
    this.connected = false;
    this.meetingId = null;
    this.drawCallback = null;
    this.clearCallback = null;
  }

  connect(meetingId) {
    console.log("[Whiteboard] connect to meeting:", meetingId);
    this.meetingId = meetingId;
    this.connected = true;
  }

  disconnect() {
    console.log("[Whiteboard] disconnect");
    this.connected = false;
    this.meetingId = null;
  }

  sendDraw(data) {
    if (!this.connected) return;
    console.log("[Whiteboard] send draw:", data);

    // mock broadcast
    if (this.drawCallback) {
      this.drawCallback(data);
    }
  }

  clearBoard() {
    if (!this.connected) return;
    console.log("[Whiteboard] clear board");

    if (this.clearCallback) {
      this.clearCallback();
    }
  }

  onReceiveDraw(callback) {
    this.drawCallback = callback;
  }

  onClearBoard(callback) {
    this.clearCallback = callback;
  }
}

const whiteboardService = new WhiteboardService();
export default whiteboardService;
