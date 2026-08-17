import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { RTCView } from './webrtc';
import { useTheme } from '../context/ThemeContext';
import { useCall, useGroupCall, avatarColorFor } from './CallContext';
import { font, radii, spacing } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function IncomingCallOverlay() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { callerInfo, isVideoCall, acceptCall, declineCall } = useCall();

  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: avatarColorFor(callerInfo?.name) }]}>
          <Text style={styles.avatarText}>{(callerInfo?.name || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.cardTitle, { color: colors.ink, textAlign: 'center' }]} numberOfLines={1}>
          {callerInfo?.name || t('Unknown')}
        </Text>
        <Text style={[styles.cardSub, { color: colors.textMuted, textAlign: 'center' }]}>
          {isVideoCall ? t('Incoming video call...') : t('Incoming call...')}
        </Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.roundBtn, { backgroundColor: colors.danger }]} onPress={declineCall}>
            <PhoneOff size={26} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roundBtn, { backgroundColor: colors.success }]} onPress={acceptCall}>
            <Phone size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function OutgoingCallOverlay() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { callerInfo, hangupCall, callState, isVideoCall } = useCall();

  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: avatarColorFor(callerInfo?.name) }]}>
          <Text style={styles.avatarText}>{(callerInfo?.name || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.cardTitle, { color: colors.ink, textAlign: 'center' }]} numberOfLines={1}>
          {callerInfo?.name || t('Unknown')}
        </Text>
        <Text style={[styles.cardSub, { color: colors.textMuted, textAlign: 'center' }]}>
          {callState === 'connecting' ? t('Connecting...') : t('Calling...')}
        </Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.roundBtn, { backgroundColor: colors.danger }]} onPress={hangupCall}>
            <PhoneOff size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ActiveCallOverlay() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    callerInfo, callDuration, isMuted, isVideoCall, isCameraOn,
    toggleMute, toggleCamera, hangupCall, remoteStream, localStream,
  } = useCall();

  const localUrl = localStream?.toURL();

  return (
    <View style={[styles.fullScreen, { backgroundColor: '#000' }]}>
      <View style={styles.remoteVideoWrap}>
        {remoteStream ? (
          <RTCView streamURL={remoteStream.toURL()} objectFit="cover" zOrder={0} style={styles.fillAbsolute} />
        ) : (
          <View style={styles.remoteFallback}>
            <View style={[styles.avatarLarge, { backgroundColor: avatarColorFor(callerInfo?.name) }]}>
              <Text style={styles.avatarTextLarge}>{(callerInfo?.name || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.remoteName} numberOfLines={1}>{callerInfo?.name || t('Call')}</Text>
            <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
          </View>
        )}
      </View>

      {localUrl ? (
        <View style={styles.localPip}>
          <RTCView streamURL={localUrl} objectFit="cover" mirror zOrder={1} style={styles.fillAbsolute} />
        </View>
      ) : null}

      <View style={styles.activeControls}>
        <TouchableOpacity
          style={[styles.ctrlBtn, isMuted ? { backgroundColor: colors.danger } : { backgroundColor: 'rgba(255,255,255,0.15)' }]}
          onPress={toggleMute}
        >
          {isMuted ? <MicOff size={22} color="#FFF" /> : <Mic size={22} color="#FFF" />}
        </TouchableOpacity>

        {isVideoCall && (
          <TouchableOpacity
            style={[styles.ctrlBtn, !isCameraOn ? { backgroundColor: colors.danger } : { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            onPress={toggleCamera}
          >
            {isCameraOn ? <Video size={22} color="#FFF" /> : <VideoOff size={22} color="#FFF" />}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: colors.danger }]} onPress={hangupCall}>
          <PhoneOff size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Reuse the live local stream URL for the PiP preview. */

function IncomingGroupCallOverlay() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { incomingInfo, isVideo, joinGroupCall, declineGroupCall } = useGroupCall();

  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: avatarColorFor(incomingInfo?.initiator_name) }]}>
          {isVideo ? <Video size={26} color="#FFF" /> : <Users size={26} color="#FFF" />}
        </View>
        <Text style={[styles.cardTitle, { color: colors.ink, textAlign: 'center' }]} numberOfLines={1}>
          {incomingInfo?.initiator_name || t('Unknown')}
        </Text>
        <Text style={[styles.cardSub, { color: colors.textMuted, textAlign: 'center' }]}>
          {isVideo ? t('Incoming group video call...') : t('Incoming group call...')}
        </Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.roundBtn, { backgroundColor: colors.danger }]} onPress={declineGroupCall}>
            <PhoneOff size={26} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roundBtn, { backgroundColor: colors.success }]} onPress={joinGroupCall}>
            <Phone size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function GroupCallConnectingOverlay() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { leaveGroupCall } = useGroupCall();

  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Users size={26} color="#FFF" />
        </View>
        <Text style={[styles.cardTitle, { color: colors.ink, textAlign: 'center' }]}>{t('Group call')}</Text>
        <Text style={[styles.cardSub, { color: colors.textMuted, textAlign: 'center' }]}>{t('Calling...')}</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.roundBtn, { backgroundColor: colors.danger }]} onPress={leaveGroupCall}>
            <PhoneOff size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ActiveGroupCallOverlay() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    callDuration, isMuted, isCameraOn, isVideo,
    participants, videoStates, localStream,
    toggleMute, toggleCamera, leaveGroupCall, endGroupCall,
  } = useGroupCall();

  const all = [
    { id: 'local', stream: localStream, name: t('You'), videoOn: isCameraOn, isLocal: true },
    ...participants.map((p) => ({ id: p.id, stream: p.stream, name: p.name, videoOn: videoStates[p.id] ?? isVideo, isLocal: false })),
  ];

  return (
    <View style={[styles.fullScreen, { backgroundColor: '#000' }]}>
      <View style={styles.groupGrid}>
        {all.map((p) => (
          <View key={p.id} style={[styles.groupCell, { backgroundColor: '#111' }]}>
            {p.stream && p.videoOn ? (
              <RTCView streamURL={p.stream.toURL()} objectFit="cover" mirror={p.isLocal} style={styles.fillAbsolute} />
            ) : (
              <View style={[styles.groupAvatar, { backgroundColor: avatarColorFor(p.name) }]}>
                <Text style={styles.avatarText}>{(p.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.groupLabelWrap}>
              <Text style={styles.groupLabel} numberOfLines={1}>{p.name}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.groupTopBar}>
        <View style={styles.liveDot} />
        <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
      </View>

      <View style={styles.activeControls}>
        <TouchableOpacity
          style={[styles.ctrlBtn, isMuted ? { backgroundColor: colors.danger } : { backgroundColor: 'rgba(255,255,255,0.15)' }]}
          onPress={toggleMute}
        >
          {isMuted ? <MicOff size={22} color="#FFF" /> : <Mic size={22} color="#FFF" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctrlBtn, !isCameraOn ? { backgroundColor: colors.danger } : { backgroundColor: 'rgba(255,255,255,0.15)' }]}
          onPress={toggleCamera}
        >
          {isCameraOn ? <Video size={22} color="#FFF" /> : <VideoOff size={22} color="#FFF" />}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: colors.danger }]} onPress={endGroupCall}>
          <PhoneOff size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function CallOverlays() {
  const call = useCall();
  const group = useGroupCall();

  if (group.groupCallState === 'connected') return <ActiveGroupCallOverlay />;
  if (group.groupCallState === 'ringing') return <IncomingGroupCallOverlay />;
  if (group.groupCallState === 'connecting' || group.groupCallState === 'calling') return <GroupCallConnectingOverlay />;

  if (call.callState === 'connected') return <ActiveCallOverlay />;
  if (call.callState === 'ringing') return <IncomingCallOverlay />;
  if (call.callState === 'calling' || call.callState === 'connecting') return <OutgoingCallOverlay />;

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  fullScreen: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  card: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    width: SCREEN_WIDTH * 0.85,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 80,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 80,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
  },
  avatarLarge: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 110,
    justifyContent: 'center',
    width: 110,
  },
  avatarTextLarge: {
    color: '#FFF',
    fontSize: 44,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: font.sizes.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
    maxWidth: SCREEN_WIDTH * 0.7,
  },
  cardSub: {
    fontSize: font.sizes.sm,
    marginBottom: spacing.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  roundBtn: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  remoteVideoWrap: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  remoteFallback: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  remoteName: {
    color: '#FFF',
    fontSize: font.sizes.xl,
    fontWeight: '700',
    marginTop: spacing.md,
    maxWidth: SCREEN_WIDTH * 0.8,
    textAlign: 'center',
  },
  durationText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: font.sizes.sm,
    marginTop: spacing.xs,
  },
  localPip: {
    borderRadius: radii.lg,
    height: SCREEN_HEIGHT * 0.22,
    overflow: 'hidden',
    position: 'absolute',
    right: spacing.md,
    top: spacing.xl,
    width: SCREEN_WIDTH * 0.3,
  },
  activeControls: {
    alignItems: 'center',
    bottom: 40,
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  ctrlBtn: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  groupGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  groupCell: {
    borderRadius: radii.lg,
    height: SCREEN_HEIGHT * 0.3,
    overflow: 'hidden',
    width: (SCREEN_WIDTH - spacing.md * 2 - spacing.xs) / 2,
  },
  groupAvatar: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 56,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -28,
    marginTop: -28,
    position: 'absolute',
    top: '45%',
    width: 56,
  },
  groupLabelWrap: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radii.sm,
    bottom: 6,
    left: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    position: 'absolute',
  },
  groupLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: font.sizes.xs,
  },
  groupTopBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 40,
  },
  liveDot: {
    backgroundColor: '#38C793',
    borderRadius: radii.full,
    height: 10,
    width: 10,
  },
  fillAbsolute: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
