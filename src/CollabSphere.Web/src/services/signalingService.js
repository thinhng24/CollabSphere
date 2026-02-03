// src/services/signalingService.js

class SignalingService {
  constructor() {
    this.connected = false;
    this.meetingId = null;
  }

  connect(meetingId) {
    console.log("[Signaling] connect to meeting:", meetingId);
    this.meetingId = meetingId;
    this.connected = true;
  }

  disconnect() {
    console.log("[Signaling] disconnect");
    this.connected = false;
    this.meetingId = null;
  }

  sendOffer(offer) {
    if (!this.connected) return;
    console.log("[Signaling] send offer:", offer);
  }

  sendAnswer(answer) {
    if (!this.connected) return;
    console.log("[Signaling] send answer:", answer);
  }

  sendIceCandidate(candidate) {
    if (!this.connected) return;
    console.log("[Signaling] send ICE candidate:", candidate);
  }

  onReceiveOffer(callback) {
    console.log("[Signaling] register receive offer");
    this.onOffer = callback;
  }

  onReceiveAnswer(callback) {
    console.log("[Signaling] register receive answer");
    this.onAnswer = callback;
  }

  onReceiveIceCandidate(callback) {
    console.log("[Signaling] register receive ICE");
    this.onIce = callback;
  }
}

const signalingService = new SignalingService();
export default signalingService;
