// utils/webrtc.js
export class WebRTCManager {
  constructor(userId) {
    this.peers = new Map();
    this.localStream = null;
    this.userId = userId;
  }

  async initializeLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createPeerConnection(targetUserId) {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    // ICE candidate handling
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate(targetUserId, event.candidate);
      }
    };

    // Track remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.peers.set(targetUserId, {
        peer: peerConnection,
        stream: remoteStream
      });
      
      // Emit event to update UI
      window.dispatchEvent(new CustomEvent('remote-stream', {
        detail: { userId: targetUserId, stream: remoteStream }
      }));
    };

    return peerConnection;
  }

  async createOffer(targetUserId) {
    const peerConnection = await this.createPeerConnection(targetUserId);
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    
    await peerConnection.setLocalDescription(offer);
    this.peers.set(targetUserId, { peer: peerConnection });
    
    return offer;
  }

  async handleOffer(targetUserId, offer) {
    const peerConnection = await this.createPeerConnection(targetUserId);
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(offer)
    );
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    this.peers.set(targetUserId, { peer: peerConnection });
    
    return answer;
  }

  async handleAnswer(targetUserId, answer) {
    const peerData = this.peers.get(targetUserId);
    if (peerData && peerData.peer) {
      await peerData.peer.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    }
  }

  async handleIceCandidate(targetUserId, candidate) {
    const peerData = this.peers.get(targetUserId);
    if (peerData && peerData.peer) {
      await peerData.peer.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    }
  }

  cleanup() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    this.peers.forEach(peerData => {
      if (peerData.peer) {
        peerData.peer.close();
      }
    });

    this.peers.clear();
  }
}