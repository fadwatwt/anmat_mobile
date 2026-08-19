import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { mediaDevices, MediaStream, RTCPeerConnection, isWebRTCSupported } from './webrtc';
import { useAuth } from '../context/AuthContext';
import { connectSocket, getSocket } from '../services/socket';


type CallState = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected';

type CallValue = {
  callState: CallState;
  callerInfo: { name: string } | null;
  callDuration: number;
  isMuted: boolean;
  isVideoCall: boolean;
  isCameraOn: boolean;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  initiateCall: (chatId: string, targetUserId: string, targetUserName: string, isVideo?: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  hangupCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
};

type GroupCallValue = {
  groupCallState: CallState;
  incomingInfo: { initiator_id: string; initiator_name: string; is_video: boolean } | null;
  isVideo: boolean;
  callDuration: number;
  isMuted: boolean;
  isCameraOn: boolean;
  participants: { id: string; stream: MediaStream | null; name: string }[];
  videoStates: Record<string, boolean>;
  localStream: MediaStream | null;
  initiateGroupCall: (chatId: string, video?: boolean) => Promise<void>;
  joinGroupCall: () => Promise<void>;
  declineGroupCall: () => void;
  leaveGroupCall: () => void;
  endGroupCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
};

const CallContext = createContext<CallValue | undefined>(undefined);
const GroupCallContext = createContext<GroupCallValue | undefined>(undefined);

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used inside CallProvider');
  return ctx;
};

export const useGroupCall = () => {
  const ctx = useContext(GroupCallContext);
  if (!ctx) throw new Error('useGroupCall must be used inside GroupCallProvider');
  return ctx;
};

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/** Normalize a relayed ICE candidate payload into RTCIceCandidateInit. */
const normalizeCandidate = (candidate: any): any => {
  if (!candidate) return null;
  if (candidate.candidate && typeof candidate.candidate === 'object') {
    return candidate.candidate;
  }
  return candidate;
};

function CallProviderInner({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const currentUserId = user?._id?.toString();
  const currentUserName = user?.name || 'Unknown';

  const [callState, setCallState] = useState<CallState>('idle');
  const [callerInfo, setCallerInfo] = useState<{ name: string } | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);
  const currentChatIdRef = useRef<string | null>(null);
  const currentTargetUserIdRef = useRef<string | null>(null);
  const isVideoCallRef = useRef(false);

  const getMedia = useCallback(async (withVideo: boolean): Promise<MediaStream | null> => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: withVideo ? { facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('[Call] getUserMedia error:', err);
      return null;
    }
  }, []);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((tr: any) => tr.stop());
    localStreamRef.current = null;
    setLocalStream(null);
  }, []);

  const cleanupPeer = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
  }, []);

  const cleanupCall = useCallback(() => {
    cleanupPeer();
    stopMedia();
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setCallDuration(0);
    durationRef.current = 0;
    currentChatIdRef.current = null;
    currentTargetUserIdRef.current = null;
    setCallerInfo(null);
    setIsMuted(false);
    setIsVideoCall(false);
    setIsCameraOn(false);
    isVideoCallRef.current = false;
    setRemoteStream(null);
  }, [cleanupPeer, stopMedia]);

  const createPeer = useCallback((initiator: boolean, stream: MediaStream): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_CONFIG);
    stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

    pc.onicecandidate = (event: any) => {
      const socket = getSocket();
      if (!socket || !event?.candidate || !currentTargetUserIdRef.current) return;
      socket.emit('ice_candidate', {
        target_user_id: currentTargetUserIdRef.current,
        candidate: {
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid,
        },
      });
    };

    pc.ontrack = (event: any) => {
      if (event?.streams?.[0]) setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        if (!durationIntervalRef.current) {
          const start = Date.now();
          durationIntervalRef.current = setInterval(() => {
            const d = Math.floor((Date.now() - start) / 1000);
            setCallDuration(d);
            durationRef.current = d;
          }, 1000);
        }
      } else if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed' ||
        pc.connectionState === 'disconnected'
      ) {
        setCallState('idle');
        cleanupCall();
      }
    };

    return pc;
  }, [cleanupCall]);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    const handleIncomingCall = ({ chat_id, caller_id, caller_name, is_video }: any) => {
      if (callState !== 'idle') {
        socket.emit('call_busy', { target_user_id: caller_id, chat_id });
        return;
      }
      currentChatIdRef.current = chat_id;
      currentTargetUserIdRef.current = caller_id;
      setCallerInfo({ name: caller_name });
      isVideoCallRef.current = !!is_video;
      setIsVideoCall(!!is_video);
      setCallState('ringing');
    };

    const handleCallAccepted = async () => {
      setCallState('connecting');
      const stream = await getMedia(isVideoCallRef.current);
      if (!stream) {
        cleanupCall();
        setCallState('idle');
        return;
      }
      const pc = createPeer(true, stream);
      peerRef.current = pc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const target = currentTargetUserIdRef.current;
      if (target) {
        socket.emit('call_offer', {
          target_user_id: target,
          sdp: { type: offer.type, sdp: offer.sdp },
        });
      }
    };

    const handleCallOffer = async ({ sdp }: any) => {
      if (callState !== 'ringing' && callState !== 'connecting') return;
      const stream = await getMedia(isVideoCallRef.current);
      if (!stream) {
        cleanupCall();
        setCallState('idle');
        return;
      }
      const pc = createPeer(false, stream);
      peerRef.current = pc;
      await pc.setRemoteDescription(sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      const target = currentTargetUserIdRef.current;
      if (target) {
        socket.emit('call_answer', {
          target_user_id: target,
          sdp: { type: answer.type, sdp: answer.sdp },
        });
      }
    };

    const handleCallAnswer = async ({ sdp }: any) => {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(sdp);
    };

    const handleIceCandidate = async ({ candidate }: any) => {
      if (!peerRef.current) return;
      const init = normalizeCandidate(candidate);
      if (!init) return;
      try {
        await peerRef.current.addIceCandidate(init);
      } catch (e) {
        console.warn('[Call] addIceCandidate error:', (e as Error)?.message);
      }
    };

    const endCall = () => {
      setCallState('idle');
      cleanupCall();
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_offer', handleCallOffer);
    socket.on('call_answer', handleCallAnswer);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('call_hangup', endCall);
    socket.on('call_decline', endCall);
    socket.on('call_busy', endCall);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_offer', handleCallOffer);
      socket.off('call_answer', handleCallAnswer);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('call_hangup', endCall);
      socket.off('call_decline', endCall);
      socket.off('call_busy', endCall);
    };
  }, [token, callState, getMedia, createPeer, cleanupCall]);

  const initiateCall = useCallback(async (chatId: string, targetUserId: string, targetUserName: string, isVideo = false) => {
    if (callState !== 'idle') return;
    currentChatIdRef.current = chatId;
    currentTargetUserIdRef.current = targetUserId;
    setCallerInfo({ name: targetUserName });
    isVideoCallRef.current = isVideo;
    setIsVideoCall(isVideo);
    setIsCameraOn(isVideo);

    const socket = getSocket();
    if (!socket?.connected) return;

    socket.emit('call_initiate', {
      chat_id: chatId,
      target_user_id: targetUserId,
      caller_id: currentUserId,
      caller_name: currentUserName,
      is_video: isVideo,
    });
    setCallState('calling');
  }, [callState, currentUserId, currentUserName]);

  const acceptCall = useCallback(async () => {
    const socket = getSocket();
    if (socket && currentTargetUserIdRef.current) {
      socket.emit('call_accept', { target_user_id: currentTargetUserIdRef.current });
    }
    setIsCameraOn(isVideoCallRef.current);
    await getMedia(isVideoCallRef.current);
    setCallState('connecting');
  }, [getMedia]);

  const declineCall = useCallback(() => {
    const socket = getSocket();
    if (socket && currentTargetUserIdRef.current) {
      socket.emit('call_decline', {
        target_user_id: currentTargetUserIdRef.current,
        chat_id: currentChatIdRef.current,
      });
    }
    setCallState('idle');
    cleanupCall();
  }, [cleanupCall]);

  const hangupCall = useCallback(() => {
    const socket = getSocket();
    if (socket && currentTargetUserIdRef.current) {
      socket.emit('call_hangup', {
        target_user_id: currentTargetUserIdRef.current,
        chat_id: currentChatIdRef.current,
        duration: durationRef.current,
      });
    }
    setCallState('idle');
    cleanupCall();
  }, [cleanupCall]);

  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  }, []);

  const value = useMemo<CallValue>(() => ({
    callState,
    callerInfo,
    callDuration,
    isMuted,
    isVideoCall,
    isCameraOn,
    remoteStream,
    localStream,
    initiateCall,
    acceptCall,
    declineCall,
    hangupCall,
    toggleMute,
    toggleCamera,
  }), [callState, callerInfo, callDuration, isMuted, isVideoCall, isCameraOn, remoteStream, localStream,
    initiateCall, acceptCall, declineCall, hangupCall, toggleMute, toggleCamera]);

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

const AVATAR_COLORS = ['#DF1C41', '#375DFB', '#38C793', '#F17B2C', '#7C3AED', '#DB2777', '#4F46E5', '#0D9488', '#EA580C', '#0891B2'];

export function avatarColorFor(name?: string) {
  return AVATAR_COLORS[(name || '?').length % AVATAR_COLORS.length];
}

function GroupCallProviderInner({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const currentUserId = user?._id?.toString();
  const currentUserName = user?.name || 'Unknown';

  const [groupCallState, setGroupCallState] = useState<CallState>('idle');
  const [incomingInfo, setIncomingInfo] = useState<GroupCallValue['incomingInfo']>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [participants, setParticipants] = useState<{ id: string; stream: MediaStream | null; name: string }[]>([]);
  const [videoStates, setVideoStates] = useState<Record<string, boolean>>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const currentChatIdRef = useRef<string | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());

  const getMedia = useCallback(async (withVideo: boolean): Promise<MediaStream | null> => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: withVideo ? { facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsCameraOn(withVideo);
      return stream;
    } catch (err) {
      console.error('[GroupCall] getUserMedia error:', err);
      return null;
    }
  }, []);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((tr: any) => tr.stop());
    localStreamRef.current = null;
    setLocalStream(null);
  }, []);

  const destroyAllPeers = useCallback(() => {
    peersRef.current.forEach((pc) => {
      try { pc.close(); } catch (e) { /* ignore */ }
    });
    peersRef.current.clear();
  }, []);

  const cleanupCall = useCallback(() => {
    stopMedia();
    destroyAllPeers();
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setCallDuration(0);
    setGroupCallState('idle');
    setIncomingInfo(null);
    setIsVideo(false);
    setIsMuted(false);
    setIsCameraOn(false);
    setParticipants([]);
    setVideoStates({});
    currentChatIdRef.current = null;
  }, [stopMedia, destroyAllPeers]);

  const createPeer = useCallback((targetUserId: string, initiator: boolean, stream: MediaStream): RTCPeerConnection | null => {
    const existing = peersRef.current.get(targetUserId);
    if (existing) {
      try { existing.close(); } catch (e) { /* ignore */ }
      peersRef.current.delete(targetUserId);
    }

    const pc = new RTCPeerConnection(ICE_CONFIG);
    stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

    pc.onicecandidate = (event: any) => {
      const socket = getSocket();
      if (!socket || !event?.candidate) return;
      socket.emit('group_call_ice', {
        target_user_id: targetUserId,
        user_id: currentUserId,
        candidate: {
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid,
        },
      });
    };

    pc.ontrack = (event: any) => {
      if (!event?.streams?.[0]) return;
      const remote = event.streams[0];
      setParticipants((prev) => prev.map((p) => (p.id === targetUserId ? { ...p, stream: remote } : p)));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
        peersRef.current.delete(targetUserId);
        setParticipants((prev) => prev.filter((p) => p.id !== targetUserId));
      }
    };

    peersRef.current.set(targetUserId, pc);
    return pc;
  }, [currentUserId]);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    const handleIncomingGroupCall = ({ chat_id, is_video, initiator_id, initiator_name }: any) => {
      if (groupCallState !== 'idle') return;
      currentChatIdRef.current = chat_id;
      setIncomingInfo({ initiator_id, initiator_name, is_video: !!is_video });
      setIsVideo(!!is_video);
      setGroupCallState('ringing');
    };

    const handleGroupCallReady = async ({ participants: existing, is_video }: any) => {
      setIsVideo(!!is_video);
      const stream = await getMedia(is_video);
      if (!stream) { cleanupCall(); return; }
      setGroupCallState('connected');
      setParticipants((existing || []).map((p: any) => ({ id: p.id, stream: null, name: p.name })));
      setVideoStates({ [currentUserId || '']: !!is_video, ...Object.fromEntries((existing || []).map((p: any) => [p.id, !!is_video])) });
      const start = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    };

    const handleGroupCallJoined = async ({ participants: existing, is_video }: any) => {
      setIsVideo(!!is_video);
      const stream = await getMedia(is_video);
      if (!stream) { cleanupCall(); return; }
      setGroupCallState('connected');
      setParticipants((existing || []).map((p: any) => ({ id: p.id, stream: null, name: p.name })));
      setVideoStates({ [currentUserId || '']: !!is_video, ...Object.fromEntries((existing || []).map((p: any) => [p.id, !!is_video])) });
      const start = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      (existing || []).forEach((p: any) => createPeer(p.id, false, stream));
    };

    const handleParticipantJoined = ({ user_id, name }: any) => {
      if (groupCallState !== 'connected' || user_id === currentUserId) return;
      setParticipants((prev) => {
        if (prev.find((p) => p.id === user_id)) return prev;
        return [...prev, { id: user_id, stream: null, name }];
      });
      setVideoStates((prev) => ({ ...prev, [user_id]: isVideo }));
      const stream = localStreamRef.current;
      if (!stream) return;
      createPeer(user_id, true, stream);
    };

    const handleVideoState = ({ user_id, video_on }: any) => {
      setVideoStates((prev) => ({ ...prev, [user_id]: video_on }));
    };

    const handleParticipantLeft = ({ user_id }: any) => {
      const pc = peersRef.current.get(user_id);
      if (pc) {
        try { pc.close(); } catch (e) { /* ignore */ }
        peersRef.current.delete(user_id);
      }
      setParticipants((prev) => prev.filter((p) => p.id !== user_id));
    };

    const handleGroupCallEnded = () => {
      cleanupCall();
    };

    const handleOffer = async ({ user_id, sdp }: any) => {
      if (groupCallState !== 'connected') return;
      let pc = peersRef.current.get(user_id);
      if (!pc) {
        const stream = localStreamRef.current;
        if (!stream) return;
        pc = createPeer(user_id, false, stream) || undefined;
      }
      if (!pc) return;
      await pc.setRemoteDescription(sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      const socket = getSocket();
      socket?.emit('group_call_answer', {
        target_user_id: user_id,
        user_id: currentUserId,
        sdp: { type: answer.type, sdp: answer.sdp },
      });
    };

    const handleAnswer = async ({ user_id, sdp }: any) => {
      const pc = peersRef.current.get(user_id);
      if (pc) await pc.setRemoteDescription(sdp);
    };

    const handleIce = async ({ user_id, candidate }: any) => {
      const pc = peersRef.current.get(user_id);
      if (!pc) return;
      const init = normalizeCandidate(candidate);
      if (!init) return;
      try {
        await pc.addIceCandidate(init);
      } catch (e) {
        console.warn('[GroupCall] addIceCandidate error:', (e as Error)?.message);
      }
    };

    socket.on('incoming_group_call', handleIncomingGroupCall);
    socket.on('group_call_ready', handleGroupCallReady);
    socket.on('group_call_joined', handleGroupCallJoined);
    socket.on('group_call_participant_joined', handleParticipantJoined);
    socket.on('group_call_participant_left', handleParticipantLeft);
    socket.on('group_call_ended', handleGroupCallEnded);
    socket.on('group_call_offer', handleOffer);
    socket.on('group_call_answer', handleAnswer);
    socket.on('group_call_ice', handleIce);
    socket.on('group_call_video_state', handleVideoState);

    return () => {
      socket.off('incoming_group_call', handleIncomingGroupCall);
      socket.off('group_call_ready', handleGroupCallReady);
      socket.off('group_call_joined', handleGroupCallJoined);
      socket.off('group_call_participant_joined', handleParticipantJoined);
      socket.off('group_call_participant_left', handleParticipantLeft);
      socket.off('group_call_ended', handleGroupCallEnded);
      socket.off('group_call_offer', handleOffer);
      socket.off('group_call_answer', handleAnswer);
      socket.off('group_call_ice', handleIce);
      socket.off('group_call_video_state', handleVideoState);
    };
  }, [token, groupCallState, getMedia, createPeer, cleanupCall, currentUserId, isVideo]);

  const initiateGroupCall = useCallback(async (chatId: string, video = false) => {
    if (groupCallState !== 'idle') return;
    currentChatIdRef.current = chatId;
    setIsVideo(video);
    setGroupCallState('connecting');
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('group_call_initiate', { chat_id: chatId, caller_name: currentUserName, is_video: video });
    } else {
      cleanupCall();
    }
  }, [groupCallState, currentUserName, cleanupCall]);

  const joinGroupCall = useCallback(async () => {
    const stream = await getMedia(incomingInfo?.is_video || false);
    if (!stream) return;
    const socket = getSocket();
    if (socket && currentChatIdRef.current) {
      socket.emit('group_call_join', { chat_id: currentChatIdRef.current, caller_name: currentUserName });
    }
    setIncomingInfo(null);
  }, [incomingInfo, getMedia, currentUserName]);

  const declineGroupCall = useCallback(() => {
    cleanupCall();
  }, [cleanupCall]);

  const leaveGroupCall = useCallback(() => {
    const socket = getSocket();
    if (socket && currentChatIdRef.current) {
      socket.emit('group_call_leave', { chat_id: currentChatIdRef.current });
    }
    cleanupCall();
  }, [cleanupCall]);

  const endGroupCall = useCallback(() => {
    const socket = getSocket();
    if (socket && currentChatIdRef.current) {
      socket.emit('group_call_end', { chat_id: currentChatIdRef.current });
    }
    cleanupCall();
  }, [cleanupCall]);

  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
      const socket = getSocket();
      if (socket && currentChatIdRef.current) {
        socket.emit('group_call_video_toggle', { chat_id: currentChatIdRef.current, video_on: videoTrack.enabled });
      }
    }
  }, []);

  const value = useMemo<GroupCallValue>(() => ({
    groupCallState,
    incomingInfo,
    isVideo,
    callDuration,
    isMuted,
    isCameraOn,
    participants,
    videoStates,
    localStream,
    initiateGroupCall,
    joinGroupCall,
    declineGroupCall,
    leaveGroupCall,
    endGroupCall,
    toggleMute,
    toggleCamera,
  }), [groupCallState, incomingInfo, isVideo, callDuration, isMuted, isCameraOn, participants, videoStates,
    localStream, initiateGroupCall, joinGroupCall, declineGroupCall, leaveGroupCall, endGroupCall, toggleMute, toggleCamera]);

  return <GroupCallContext.Provider value={value}>{children}</GroupCallContext.Provider>;
}

export function CallProvider({ children }: PropsWithChildren) {
  return (
    <CallProviderInner>
      <GroupCallProviderInner>
        {children}
      </GroupCallProviderInner>
    </CallProviderInner>
  );
}
