import { RTCPeerConnection } from 'react-native-webrtc';
import { socket } from './socket'; // adjust path if needed

let peer = null;
let remoteSocketId = null;

let pendingCandidates = [];

export const setRemoteSocketId = (id) => {
  remoteSocketId = id;
};

export const createPeer = async () => {
  if (peer) return peer;
  const cred = await fetch(
    'https://taskmanagerapi.2digitinnovations.com/v1/api/getvcallcred',
  ).then(r => r.json());
  peer = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: [
          'turn:turn.2digitinnovations.com:3478',
          'turns:turn.2digitinnovations.com:5349',
        ],
        username: cred.data.username?.toString(),
        credential: cred.data.credential,
      },
    ],
  });

  // ICE Candidate handler (ONLY HERE)
  peer.onicecandidate = (event) => {
    if (event.candidate && remoteSocketId) {
      socket.emit('ice:candidate', {
        to: remoteSocketId,
        candidate: event.candidate,
      });
    }
  };

  peer.oniceconnectionstatechange = () => {
    console.log('ICE STATE =>', peer.iceConnectionState);
  };

  return peer;
};

export const getPeer = () => peer;

export const closePeer = () => {
  if (peer) {
    peer.close();
    peer = null;
  }
};

export const createOffer = async () => {
  if (!peer) return null;

  if (peer.signalingState !== 'stable') {
    console.log('⚠️ Not stable → skip offer');
    return;
  }

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  return offer;
};

export const createAnswer = async (offer) => {
  if (!peer) return null;

  await peer.setRemoteDescription(offer);

  while (pendingCandidates.length) {
    const candidate = pendingCandidates.shift();
    try {
      await peer.addIceCandidate(candidate);
    } catch (err) {
      console.log('Flush ICE error', err);
    }
  }

  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  return answer;
};

export const setRemoteAnswer = async (answer) => {
  if (!peer) return;

  await peer.setRemoteDescription(answer);

  // 🔥 Now flush queued candidates
  while (pendingCandidates.length) {
    const candidate = pendingCandidates.shift();
    try {
      await peer.addIceCandidate(candidate);
    } catch (err) {
      console.log('Flush ICE error', err);
    }
  }
};

export const addIceCandidate = async (candidate) => {
  if (!peer) return;

  if (peer.remoteDescription && peer.remoteDescription.type) {
    try {
      await peer.addIceCandidate(candidate);
    } catch (err) {
      console.log('ICE add error', err);
    }
  } else {
    console.log('⏳ Queueing ICE candidate');
    pendingCandidates.push(candidate);
  }
};

