import { NativeModules, View } from 'react-native';

/**
 * Safe wrapper around react-native-webrtc.
 * In Expo Go, native WebRTC modules are unavailable.
 * This fallback prevents unhandled native module initialization crashes at app startup.
 */

let webrtcModule: any = null;

try {
  if (NativeModules.WebRTCModule) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    webrtcModule = require('react-native-webrtc');
  }
} catch {
  webrtcModule = null;
}

export const isWebRTCSupported = Boolean(webrtcModule && NativeModules.WebRTCModule);

export const mediaDevices = webrtcModule?.mediaDevices ?? {
  getUserMedia: async () => null,
};

export const RTCPeerConnection =
  webrtcModule?.RTCPeerConnection ??
  class MockRTCPeerConnection {
    close() {}
    addTrack() {}
    createOffer() {
      return Promise.resolve({ type: 'offer', sdp: '' });
    }
    createAnswer() {
      return Promise.resolve({ type: 'answer', sdp: '' });
    }
    setLocalDescription() {
      return Promise.resolve();
    }
    setRemoteDescription() {
      return Promise.resolve();
    }
    addIceCandidate() {
      return Promise.resolve();
    }
  };

export const RTCView = webrtcModule?.RTCView ?? View;

export type MediaStream = any;
