import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {};
  }

  connect(meetingId, userId) {
    this.socket = io('http://localhost:3001', {
      query: {
        meetingId,
        userId
      },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
      this.joinMeeting(meetingId, userId);
    });

    this.setupListeners();
  }

  joinMeeting(meetingId, userId) {
    this.socket.emit('join-meeting', {
      meetingId,
      userId,
      userData: {
        name: localStorage.getItem('userName'),
        role: localStorage.getItem('userRole')
      }
    });
  }

  setupListeners() {
    // Participant events
    this.socket.on('user-joined', (user) => {
      this.emitCallback('userJoined', user);
    });

    this.socket.on('user-left', (userId) => {
      this.emitCallback('userLeft', userId);
    });

    this.socket.on('participants-updated', (participants) => {
      this.emitCallback('participantsUpdated', participants);
    });

    // Media events
    this.socket.on('offer', (data) => {
      this.emitCallback('offerReceived', data);
    });

    this.socket.on('answer', (data) => {
      this.emitCallback('answerReceived', data);
    });

    this.socket.on('ice-candidate', (data) => {
      this.emitCallback('iceCandidateReceived', data);
    });

    // Chat events
    this.socket.on('chat-message', (message) => {
      this.emitCallback('chatMessageReceived', message);
    });

    // Whiteboard events
    this.socket.on('drawing', (data) => {
      this.emitCallback('drawingReceived', data);
    });

    this.socket.on('whiteboard-clear', () => {
      this.emitCallback('whiteboardCleared');
    });

    // Control events
    this.socket.on('user-media-updated', (data) => {
      this.emitCallback('userMediaUpdated', data);
    });

    this.socket.on('screen-sharing-started', (data) => {
      this.emitCallback('screenSharingStarted', data);
    });

    this.socket.on('screen-sharing-stopped', (userId) => {
      this.emitCallback('screenSharingStopped', userId);
    });
  }

  // Emit methods
  sendOffer(toUserId, offer) {
    this.socket.emit('offer', {
      to: toUserId,
      offer
    });
  }

  sendAnswer(toUserId, answer) {
    this.socket.emit('answer', {
      to: toUserId,
      answer
    });
  }

  sendIceCandidate(toUserId, candidate) {
    this.socket.emit('ice-candidate', {
      to: toUserId,
      candidate
    });
  }

  sendChatMessage(message) {
    this.socket.emit('chat-message', message);
  }

  sendDrawing(data) {
    this.socket.emit('drawing', data);
  }

  clearWhiteboard() {
    this.socket.emit('whiteboard-clear');
  }

  updateMediaStatus(status) {
    this.socket.emit('update-media', status);
  }

  startScreenShare(streamId) {
    this.socket.emit('screen-share-start', { streamId });
  }

  stopScreenShare() {
    this.socket.emit('screen-share-stop');
  }

  // Callback management
  on(event, callback) {
    this.callbacks[event] = callback;
  }

  off(event) {
    delete this.callbacks[event];
  }

  emitCallback(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();