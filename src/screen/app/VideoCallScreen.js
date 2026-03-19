/**
 * React Native WebRTC Video Call — with OneSignal Push Notifications
 *
 * Dependencies:
 *   npm install react-native-webrtc socket.io-client react-native-incall-manager
 *   npm install react-native-onesignal
 *   cd ios && pod install && cd ..
 *
 * Android — AndroidManifest.xml:
 *   <uses-permission android:name="android.permission.CAMERA" />
 *   <uses-permission android:name="android.permission.RECORD_AUDIO" />
 *   <uses-permission android:name="android.permission.INTERNET" />
 *   <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
 *   <uses-permission android:name="android.permission.BLUETOOTH" />
 *   <uses-permission android:name="android.permission.WAKE_LOCK" />
 *   <uses-permission android:name="android.permission.VIBRATE" />
 *
 * iOS — Info.plist: NSCameraUsageDescription, NSMicrophoneUsageDescription
 *
 * OneSignal setup:
 *   https://documentation.onesignal.com/docs/react-native-sdk-setup
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Alert,
    Platform,
    PermissionsAndroid,
    StatusBar,
    ActivityIndicator,
    AppState,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InCallManager from 'react-native-incall-manager';
import { OneSignal } from 'react-native-onesignal';
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    mediaDevices,
} from 'react-native-webrtc';
import { io } from 'socket.io-client';
import IncomingCallScreen from './IncommingCallScreen'; // adjust path if needed
import { SOCKET_URL } from '../../../utils/config';
import {TURN_CREDENTIAL} from '../../../utils/config'

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const SIGNALING_SERVER_URL = SOCKET_URL;

const STUN_SERVER_URL = 'stun:turn.flaychatbar.com:3478';
const TURN_SERVER_URL = 'turn:turn.flaychatbar.com:3478';
const TURN_USERNAME = (Math.floor(Date.now() / 1000) + 3600).toString();

const ICE_SERVERS = [
    { urls: STUN_SERVER_URL },
    { urls: TURN_SERVER_URL, username: TURN_USERNAME, credential: TURN_CREDENTIAL },
    { urls: `${TURN_SERVER_URL}?transport=udp`, username: TURN_USERNAME, credential: TURN_CREDENTIAL },
    { urls: `${TURN_SERVER_URL}?transport=tcp`, username: TURN_USERNAME, credential: TURN_CREDENTIAL },
];

const PEER_CONNECTION_CONFIG = {
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * VideoCallScreen
 *
 * Props:
 *   roomId      {string}    – Unique room identifier
 *   userId      {string}    – Current user's ID
 *   calleeId    {string}    – Remote user's ID (to send them a notification)
 *   calleeName  {string}    – Remote user's display name
 *   callerName  {string}    – Your display name (shown on their incoming call screen)
 *   onHangup    {function}  – Called after the call ends (optional)
 */
const VideoCallScreen = ({
    roomId = 'room-1',
    userId = 'user-1',
    calleeId = 'user-2',
    calleeName = 'Remote User',
    callerName = 'Me',
    isInitiator = null,  // null=detect from server, true=caller, false=callee
    onHangup,
}) => {
    // ── State ──────────────────────────────────────────────────────────────────
    const [callStatus, setCallStatus] = useState('idle');
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [incomingCall, setIncomingCall] = useState(null);
    // incomingCall: { callerName, roomId } | null

    // ── Refs ───────────────────────────────────────────────────────────────────
    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const remoteDescSetRef = useRef(false);
    const isMountedRef = useRef(true);
    const callStartedRef = useRef(false);
    const isInitiatorRef = useRef(false); // true = caller, false = callee

    const log = useCallback((...args) => console.log('[VideoCall]', ...args), []);
    const safeSetState = useCallback((setter) => { if (isMountedRef.current) setter(); }, []);

    // ── Animation refs ─────────────────────────────────────────────────────────
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const controlsAnim = useRef(new Animated.Value(1)).current;
    const connectAnim = useRef(new Animated.Value(0)).current;
    const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
    const PIP_W = 110; const PIP_H = 165;
    const pipPos = useRef(new Animated.ValueXY({
        x: SCREEN_W - PIP_W - 16,
        y: 80,
    })).current;

    const pipPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pipPos.setOffset({ x: pipPos.x._value, y: pipPos.y._value });
                pipPos.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pipPos.x, dy: pipPos.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, g) => {
                pipPos.flattenOffset();
                // Snap to nearest edge
                const cx = pipPos.x._value + PIP_W / 2;
                const snapX = cx < SCREEN_W / 2 ? 16 : SCREEN_W - PIP_W - 16;
                const snapY = Math.min(Math.max(pipPos.y._value, 80), SCREEN_H - PIP_H - 120);
                Animated.spring(pipPos, {
                    toValue: { x: snapX, y: snapY },
                    useNativeDriver: false,
                    tension: 100,
                    friction: 8,
                }).start();
            },
        })
    ).current;

    // ── Pulse animation for waiting state ─────────────────────────────────────
    useEffect(() => {
        if (callStatus === 'waiting') {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
        pulseAnim.setValue(1);
    }, [callStatus]);

    // ── Fade in controls ───────────────────────────────────────────────────────
    useEffect(() => {
        if (callStatus === 'connected' || callStatus === 'connecting' || callStatus === 'waiting') {
            Animated.timing(controlsAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
            Animated.timing(connectAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        }
    }, [callStatus]);

    // ── Guard: track whether Android Activity is fully attached ───────────────
    const isActivityReadyRef = useRef(Platform.OS !== 'android'); // iOS is always ready

    useEffect(() => {
        if (Platform.OS !== 'android') return;
        // On Android, wait for AppState to be 'active' before doing anything
        // that requires the Activity (permissions, alerts, etc.)
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                isActivityReadyRef.current = true;
            }
        });
        // Also mark ready immediately if already active
        if (AppState.currentState === 'active') {
            isActivityReadyRef.current = true;
        }
        return () => sub.remove();
    }, []);

    // ── Auto-start as CALLER when navigated from Users list ───────────────────
    // ── Auto-start as CALLEE when navigated from incoming call ────────────────
    useEffect(() => {
        if (isInitiator === true && !callStartedRef.current) {
            const t = setTimeout(() => startCall(), Platform.OS === 'android' ? 500 : 100);
            return () => clearTimeout(t);
        }
        if (isInitiator === false && !callStartedRef.current) {
            const t = setTimeout(() => answerCall(roomId), Platform.OS === 'android' ? 500 : 100);
            return () => clearTimeout(t);
        }
    }, []); // intentionally empty — run once on mount

    // ══════════════════════════════════════════════════════════════════════════
    // STARTUP — register user + OneSignal player ID with signaling server
    // (OneSignal init, permission request, and notification handlers
    //  are now all in App.js so they work even when app is killed)
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        isMountedRef.current = true;

        const timer = setTimeout(async () => {
            // Register user with signaling server
            await registerUserWithServer(userId, callerName);

            // Register OneSignal player ID with signaling server
            const playerId = OneSignal.User.pushSubscription.id;
            if (playerId) {
                log('OneSignal Player ID:', playerId);
                registerPlayerIdWithServer(userId, playerId);
            }

            // Also listen for player ID changes (first subscription)
            OneSignal.User.pushSubscription.addEventListener('change', async (sub) => {
                const id = sub.current?.id;
                if (id) {
                    log('New OneSignal Player ID:', id);
                    await registerPlayerIdWithServer(userId, id);
                }
            });
        }, Platform.OS === 'android' ? 300 : 0);

        return () => {
            isMountedRef.current = false;
            clearTimeout(timer);
        };
    }, [userId]);

    // ── Register user (name + userId) with server so they appear in user list ──
    const registerUserWithServer = async (uid, name) => {
        try {
            await fetch(`${SIGNALING_SERVER_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: uid, name }),
            });
            log('User registered with server:', uid, name);
        } catch (err) {
            log('User registration error:', err.message);
        }
    };

    // ── Register OneSignal Player ID with your signaling server ───────────────
    const registerPlayerIdWithServer = async (uid, playerId) => {
        try {
            const res = await fetch(`${SIGNALING_SERVER_URL}/register-player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: uid, playerId }),
            });
            const data = await res.json();
            log('Player ID registered with server:', data);
        } catch (err) {
            log('Player registration error:', err.message);
        }
    };

    // ── Send call notification to callee via your server ─────────────────────
    const sendCallNotification = useCallback(async () => {
        try {
            const res = await fetch(`${SIGNALING_SERVER_URL}/notify-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callerId: userId, callerName, calleeId, roomId }),
            });
            const data = await res.json();
            log('Call notification sent:', data);
        } catch (err) {
            log('Send notification error:', err.message);
        }
    }, [userId, callerName, calleeId, roomId, log]);

    // ── Cancel call notification ──────────────────────────────────────────────
    const cancelCallNotification = useCallback(async () => {
        try {
            await fetch(`${SIGNALING_SERVER_URL}/cancel-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calleeId, roomId }),
            });
        } catch (err) {
            log('Cancel notification error:', err.message);
        }
    }, [calleeId, roomId, log]);

    // ──────────────────────────────────────────────────────────────────────────
    // WebRTC
    // ──────────────────────────────────────────────────────────────────────────

    const requestAndroidPermissions = useCallback(async () => {
        if (Platform.OS !== 'android') return true;

        try {
            // First just CHECK — no Activity needed for this
            const cameraGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
            const audioGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);

            if (cameraGranted && audioGranted) {
                log('Permissions already granted');
                return true;
            }

            // Need to request — wait for Activity to be ready
            let waited = 0;
            while (!isActivityReadyRef.current && waited < 8000) {
                await new Promise((resolve) => setTimeout(resolve, 200));
                waited += 200;
            }

            if (!isActivityReadyRef.current) {
                log('Activity never became ready — skipping permission request');
                // Return true if already partially granted, false otherwise
                return cameraGranted && audioGranted;
            }

            // Small extra delay after Activity becomes ready
            await new Promise((resolve) => setTimeout(resolve, 400));

            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.CAMERA,
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            ]);

            return (
                granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
            );
        } catch (err) {
            log('Permission error:', err.message);
            // Don't crash — try to proceed anyway (permissions may have been granted before)
            return false;
        }
    }, [log]);

    const getLocalStream = useCallback(async () => {
        if (Platform.OS === 'android') {
            const granted = await requestAndroidPermissions();
            if (!granted) {
                log('Permissions not granted — cannot start camera/mic');
                // Do NOT call Alert here — crashes if Activity not attached
                return null;
            }
        }
        try {
            const stream = await mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
            });
            stream.getAudioTracks().forEach((t) => { t.enabled = true; });
            return stream;
        } catch (err) {
            log('getUserMedia error:', err);
            if (isActivityReadyRef.current) {
                Alert.alert('Camera error', 'Could not access camera or microphone.');
            }
            return null;
        }
    }, [requestAndroidPermissions, log]);

    const drainPendingCandidates = useCallback(async () => {
        const pc = pcRef.current;
        if (!pc || pendingCandidatesRef.current.length === 0) return;
        for (const candidate of pendingCandidatesRef.current) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
            catch (err) { log('addIceCandidate (drain) error:', err); }
        }
        pendingCandidatesRef.current = [];
    }, [log]);

    const createPeerConnection = useCallback((stream) => {
        if (pcRef.current) return pcRef.current;

        const pc = new RTCPeerConnection(PEER_CONNECTION_CONFIG);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            if (event.streams?.[0]) {
                safeSetState(() => setRemoteStream(event.streams[0]));
                safeSetState(() => setCallStatus('connected'));
                InCallManager.setForceSpeakerphoneOn(true);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', { roomId, candidate: event.candidate });
            }
        };

        pc.oniceconnectionstatechange = () => {
            log('ICE state:', pc.iceConnectionState);
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                safeSetState(() => setCallStatus('ended'));
            }
        };

        pc.onconnectionstatechange = () => {
            log('Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                safeSetState(() => setCallStatus('connected'));
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                safeSetState(() => setCallStatus('ended'));
            }
        };

        pcRef.current = pc;
        return pc;
    }, [roomId, safeSetState, log]);

    const handleOffer = useCallback(async ({ offer, from }) => {
        log('Received offer from:', from);
        const stream = localStreamRef.current;
        if (!stream) return;

        const pc = createPeerConnection(stream);
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            remoteDescSetRef.current = true;
            await drainPendingCandidates();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketRef.current.emit('answer', { roomId, answer: pc.localDescription });
            safeSetState(() => setCallStatus('connecting'));
        } catch (err) { log('handleOffer error:', err); }
    }, [createPeerConnection, drainPendingCandidates, roomId, safeSetState, log]);

    const handleAnswer = useCallback(async ({ answer }) => {
        const pc = pcRef.current;
        if (!pc || pc.signalingState !== 'have-local-offer') return;
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            remoteDescSetRef.current = true;
            await drainPendingCandidates();
        } catch (err) { log('handleAnswer error:', err); }
    }, [drainPendingCandidates, log]);

    const handleIceCandidate = useCallback(async ({ candidate }) => {
        if (!candidate) return;
        if (!remoteDescSetRef.current) { pendingCandidatesRef.current.push(candidate); return; }
        const pc = pcRef.current;
        if (!pc) return;
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (err) { log('addIceCandidate error:', err); }
    }, [log]);

    const sendOffer = useCallback(async () => {
        const pc = pcRef.current;
        if (!pc || !socketRef.current || pc.signalingState !== 'stable') return;
        try {
            const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
            await pc.setLocalDescription(offer);
            socketRef.current.emit('offer', { roomId, offer: pc.localDescription });
            safeSetState(() => setCallStatus('connecting'));
        } catch (err) { log('createOffer error:', err); }
    }, [roomId, safeSetState, log]);

    const cleanupCall = useCallback(() => {
        InCallManager.stop();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
        if (socketRef.current) {
            // Emit leave before disconnect so server cleans up the room properly
            socketRef.current.emit('leave', { roomId });
            setTimeout(() => {
                socketRef.current?.disconnect();
                socketRef.current = null;
            }, 200);
        }
        remoteDescSetRef.current = false;
        pendingCandidatesRef.current = [];
        callStartedRef.current = false;
        isInitiatorRef.current = false;
    }, [roomId]);

    const connectSocket = useCallback((targetRoomId) => {
        const socket = io(SIGNALING_SERVER_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            timeout: 10000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            log('Socket connected:', socket.id);
            socket.emit('join', { roomId: targetRoomId, userId });
        });

        socket.on('connect_error', (err) => {
            log('Socket error:', err.message);
            if (isActivityReadyRef.current) {
                Alert.alert('Connection error', 'Could not connect to the signaling server.');
            }
            cleanupCall();
            safeSetState(() => setCallStatus('idle'));
        });

        socket.on('joined', ({ initiator }) => {
            log('Joined room, initiator:', initiator);
            isInitiatorRef.current = initiator;
            safeSetState(() => setCallStatus('waiting'));
        });

        socket.on('peer-joined', () => {
            log('Peer joined — creating offer');
            const stream = localStreamRef.current;
            if (!stream) {
                log('ERROR: No local stream when peer joined');
                return;
            }
            const pc = pcRef.current || createPeerConnection(stream);
            // Small delay ensures PC is fully initialised before creating offer
            setTimeout(() => sendOffer(), 100);
        });

        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);

        socket.on('call-declined', () => {
            if (isActivityReadyRef.current) {
                Alert.alert('Call Declined', `${calleeName} declined the call.`);
            }
            cleanupCall();
            safeSetState(() => setCallStatus('idle'));
        });

        socket.on('call-cancelled', () => {
            safeSetState(() => setIncomingCall(null));
            InCallManager.stopRingtone();
        });

        socket.on('peer-left', () => {
            log('Peer left — ending call');
            hangup();
        });
        socket.on('disconnect', (reason) => log('Socket disconnected:', reason));
    }, [
        userId, calleeName, createPeerConnection, sendOffer,
        handleOffer, handleAnswer, handleIceCandidate,
        cleanupCall, safeSetState, log,
    ]);

    // ── START CALL (caller taps the green button) ──────────────────────────────
    const startCall = useCallback(async () => {
        if (callStartedRef.current) return;
        callStartedRef.current = true;
        safeSetState(() => setCallStatus('starting'));

        InCallManager.start({ media: 'video', auto: true });
        InCallManager.setForceSpeakerphoneOn(true);
        safeSetState(() => setIsSpeakerOn(true));

        const stream = await getLocalStream();
        if (!stream || !isMountedRef.current) {
            callStartedRef.current = false;
            InCallManager.stop();
            safeSetState(() => setCallStatus('idle'));
            return;
        }
        localStreamRef.current = stream;
        safeSetState(() => setLocalStream(stream));

        // Notify remote user via OneSignal (through your server)
        await sendCallNotification();

        connectSocket(roomId);
    }, [getLocalStream, sendCallNotification, connectSocket, roomId, safeSetState]);

    // ── ANSWER CALL (callee taps Accept) ──────────────────────────────────────
    const answerCall = useCallback(async (incomingRoomId) => {
        safeSetState(() => setIncomingCall(null));
        if (callStartedRef.current) return;
        callStartedRef.current = true;
        safeSetState(() => setCallStatus('starting'));

        InCallManager.start({ media: 'video', auto: true });
        InCallManager.setForceSpeakerphoneOn(true);
        safeSetState(() => setIsSpeakerOn(true));

        const stream = await getLocalStream();
        if (!stream || !isMountedRef.current) {
            callStartedRef.current = false;
            InCallManager.stop();
            safeSetState(() => setCallStatus('idle'));
            return;
        }
        localStreamRef.current = stream;
        safeSetState(() => setLocalStream(stream));

        connectSocket(incomingRoomId);
    }, [getLocalStream, connectSocket, safeSetState]);

    // ── DECLINE CALL (callee taps Decline) ────────────────────────────────────
    const declineCall = useCallback((incomingRoomId) => {
        safeSetState(() => setIncomingCall(null));
        InCallManager.stopRingtone();

        const tempSocket = io(SIGNALING_SERVER_URL, { transports: ['websocket'] });
        tempSocket.on('connect', () => {
            tempSocket.emit('call-declined', { roomId: incomingRoomId });
            setTimeout(() => tempSocket.disconnect(), 1000);
        });
    }, [safeSetState]);

    // ── HANG UP ────────────────────────────────────────────────────────────────
    const hangup = useCallback(() => {
        log('Hanging up');
        cancelCallNotification();
        cleanupCall();

        // Reset ALL state to defaults so next call starts clean
        if (isMountedRef.current) {
            setLocalStream(null);
            setRemoteStream(null);
            setCallStatus('idle');
            setIsMuted(false);
            setIsCameraOff(false);
            setIsFrontCamera(true);
            setIsSpeakerOn(true);
            setIncomingCall(null);
        }

        onHangup?.();
    }, [cleanupCall, cancelCallNotification, onHangup, log]);

    // ── In-call controls ───────────────────────────────────────────────────────
    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        stream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
        safeSetState(() => setIsMuted((prev) => !prev));
    }, [safeSetState]);

    const toggleCamera = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        stream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
        safeSetState(() => setIsCameraOff((prev) => !prev));
    }, [safeSetState]);

    const switchCamera = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack?._switchCamera) {
            videoTrack._switchCamera();
            safeSetState(() => setIsFrontCamera((prev) => !prev));
        }
    }, [safeSetState]);

    const toggleSpeaker = useCallback(() => {
        const next = !isSpeakerOn;
        InCallManager.setForceSpeakerphoneOn(next);
        safeSetState(() => setIsSpeakerOn(next));
    }, [isSpeakerOn, safeSetState]);

    // ── Derived ────────────────────────────────────────────────────────────────
    const waitingLabel = isInitiatorRef.current ? 'Ringing…' : 'Connecting…';
    const statusLabel = {
        idle: '',
        starting: 'Starting…',
        waiting: waitingLabel,
        connecting: 'Connecting…',
        connected: 'Connected',
        ended: 'Call Ended',
    }[callStatus] ?? '';

    const remoteName = calleeName;

    // ══════════════════════════════════════════════════════════════════════════
    // INCOMING CALL SCREEN
    // ══════════════════════════════════════════════════════════════════════════
    if (incomingCall) {
        return (
            <IncomingCallScreen
                callerName={incomingCall.callerName}
                roomId={incomingCall.roomId}
                onAnswer={() => answerCall(incomingCall.roomId)}
                onDecline={() => declineCall(incomingCall.roomId)}
            />
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // IN-CALL SCREEN — Premium Cinematic UI
    // ══════════════════════════════════════════════════════════════════════════
    return (
        <View style={S.root}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* ── Full-bleed remote video ── */}
            {remoteStream ? (
                <RTCView
                    streamURL={remoteStream.toURL()}
                    style={StyleSheet.absoluteFillObject}
                    objectFit="cover"
                    mirror={false}
                    zOrder={0}
                />
            ) : (
                <View style={S.waitBg}>
                    {/* Animated glow rings */}
                    <Animated.View style={[S.glowRing, S.glowRing3]} />
                    <Animated.View style={[S.glowRing, S.glowRing2, { transform: [{ scale: pulseAnim }] }]} />
                    <Animated.View style={[S.glowRing, S.glowRing1, { transform: [{ scale: pulseAnim }] }]} />
                    <View style={S.waitAvatar}>
                        <Text style={S.waitAvatarText}>{remoteName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={S.waitName}>{remoteName}</Text>
                    <Text style={S.waitStatus}>{statusLabel}</Text>
                    {callStatus === 'starting' && (
                        <ActivityIndicator color="rgba(255,255,255,0.5)" style={{ marginTop: 14 }} />
                    )}
                </View>
            )}

            {/* ── Gradient overlays ── */}
            <View style={S.topGradient} pointerEvents="none" />
            <View style={S.bottomGradient} pointerEvents="none" />

            {/* ── Top HUD ── */}
            <SafeAreaView style={S.topHud} pointerEvents="box-none">
                <View style={S.hudRow}>
                    <View style={[S.statusPill, callStatus === 'connected' && S.statusPillLive]}>
                        {callStatus === 'connected' && <View style={S.liveDot} />}
                        <Text style={S.statusPillText}>
                            {callStatus === 'connected' ? 'LIVE' : statusLabel.toUpperCase()}
                        </Text>
                    </View>

                    <Text style={S.hudName} numberOfLines={1}>{remoteName}</Text>

                    <TouchableOpacity style={S.hudIconBtn} onPress={toggleSpeaker} activeOpacity={0.7}>
                        <Text style={S.hudIconText}>{isSpeakerOn ? '🔊' : '🔇'}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* ── Draggable PiP — local video ── */}
            {localStream && (
                <Animated.View
                    style={[S.pip, { transform: pipPos.getTranslateTransform() }]}
                    {...pipPanResponder.panHandlers}
                >
                    {!isCameraOff ? (
                        <RTCView
                            streamURL={localStream.toURL()}
                            style={S.pipVideo}
                            objectFit="cover"
                            mirror={isFrontCamera}
                            zOrder={1}
                        />
                    ) : (
                        <View style={S.pipOff}>
                            <Text style={{ fontSize: 22 }}>📷</Text>
                        </View>
                    )}
                    <TouchableOpacity style={S.pipFlipBtn} onPress={switchCamera} activeOpacity={0.75}>
                        <Text style={{ fontSize: 12 }}>🔃</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* ── Bottom controls ── */}
            <Animated.View style={[S.controlsDock, { opacity: controlsAnim }]}>
                <SafeAreaView edges={['bottom']}>
                    <View style={S.controlsRow}>

                        <View style={S.ctrlWrap}>
                            <TouchableOpacity
                                style={[S.ctrlBtn, isMuted && S.ctrlBtnRed]}
                                onPress={toggleMute}
                                activeOpacity={0.75}
                            >
                                <Text style={S.ctrlIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
                            </TouchableOpacity>
                            <Text style={S.ctrlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                        </View>

                        <View style={S.ctrlWrap}>
                            <TouchableOpacity
                                style={[S.ctrlBtn, isCameraOff && S.ctrlBtnRed]}
                                onPress={toggleCamera}
                                activeOpacity={0.75}
                            >
                                <Text style={S.ctrlIcon}>{isCameraOff ? '🚫' : '📹'}</Text>
                            </TouchableOpacity>
                            <Text style={S.ctrlLabel}>{isCameraOff ? 'Start Cam' : 'Stop Cam'}</Text>
                        </View>

                        {/* End call — large centre button */}
                        <View style={S.ctrlWrap}>
                            <TouchableOpacity style={S.endBtn} onPress={hangup} activeOpacity={0.85}>
                                <Text style={S.endBtnIcon}>✕</Text>
                            </TouchableOpacity>
                            <Text style={S.ctrlLabel}>End</Text>
                        </View>

                        <View style={S.ctrlWrap}>
                            <TouchableOpacity
                                style={[S.ctrlBtn, !isSpeakerOn && S.ctrlBtnRed]}
                                onPress={toggleSpeaker}
                                activeOpacity={0.75}
                            >
                                <Text style={S.ctrlIcon}>{isSpeakerOn ? '🔊' : '🔈'}</Text>
                            </TouchableOpacity>
                            <Text style={S.ctrlLabel}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
                        </View>

                        <View style={S.ctrlWrap}>
                            <TouchableOpacity style={S.ctrlBtn} onPress={switchCamera} activeOpacity={0.75}>
                                <Text style={S.ctrlIcon}>🔃</Text>
                            </TouchableOpacity>
                            <Text style={S.ctrlLabel}>Flip</Text>
                        </View>

                    </View>
                </SafeAreaView>
            </Animated.View>
        </View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },

    // Waiting background
    waitBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#04040a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowRing: {
        position: 'absolute',
        borderRadius: 9999,
        borderWidth: 1.5,
    },
    glowRing1: {
        width: 156, height: 156,
        borderColor: 'rgba(56,189,248,0.4)',
        backgroundColor: 'rgba(56,189,248,0.05)',
    },
    glowRing2: {
        width: 240, height: 240,
        borderColor: 'rgba(56,189,248,0.18)',
        backgroundColor: 'transparent',
    },
    glowRing3: {
        width: 330, height: 330,
        borderColor: 'rgba(56,189,248,0.07)',
        backgroundColor: 'transparent',
    },
    waitAvatar: {
        width: 112, height: 112, borderRadius: 56,
        backgroundColor: 'rgba(56,189,248,0.12)',
        borderWidth: 2, borderColor: 'rgba(56,189,248,0.45)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 22,
        shadowColor: '#38bdf8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 8,
    },
    waitAvatarText: {
        fontSize: 46, color: '#fff', fontWeight: '700', letterSpacing: -1,
    },
    waitName: {
        fontSize: 28, color: '#fff', fontWeight: '600',
        letterSpacing: 0.2, marginBottom: 10,
    },
    waitStatus: {
        fontSize: 13, color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2.5, textTransform: 'uppercase',
    },

    // Gradient overlays — faked with semi-transparent views
    topGradient: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 180,
        backgroundColor: 'rgba(0,0,0,0.5)',
        // soft fade — bottom edge transparent via border trick
        borderBottomWidth: 80,
        borderBottomColor: 'transparent',
        overflow: 'hidden',
    },
    bottomGradient: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 240,
        backgroundColor: 'rgba(0,0,0,0.62)',
    },

    // Top HUD
    topHud: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    },
    hudRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 44 : 14,
        paddingBottom: 10,
        gap: 10,
    },
    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    },
    statusPillLive: {
        backgroundColor: 'rgba(16,185,129,0.22)',
        borderColor: 'rgba(16,185,129,0.5)',
    },
    liveDot: {
        width: 7, height: 7, borderRadius: 4,
        backgroundColor: '#10b981',
    },
    statusPillText: {
        color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1,
    },
    hudName: {
        flex: 1, color: '#fff', fontSize: 16, fontWeight: '600',
        textAlign: 'center', letterSpacing: 0.2,
    },
    hudIconBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    hudIconText: { fontSize: 16 },

    // Draggable PiP
    pip: {
        position: 'absolute',
        width: 110, height: 165,
        borderRadius: 20,
        overflow: 'hidden',
        zIndex: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.22)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.7,
        shadowRadius: 20,
        elevation: 14,
        overflow: 'hidden'
    },
    pipVideo: { width: '100%', height: '100%', overflow: 'hidden' },
    pipOff: {
        width: '100%', height: '100%',
        backgroundColor: '#111',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden'
    },
    pipFlipBtn: {
        position: 'absolute', bottom: 6, right: 6,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center', justifyContent: 'center',
    },

    // Controls dock
    controlsDock: {
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'android' ? 28 : 10,
    },
    ctrlWrap: { alignItems: 'center', gap: 6 },

    // Frosted glass button
    ctrlBtn: {
        width: 58, height: 58, borderRadius: 29,
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 5,
    },
    ctrlBtnRed: {
        backgroundColor: 'rgba(239,68,68,0.3)',
        borderColor: 'rgba(239,68,68,0.55)',
    },
    ctrlIcon: { fontSize: 22 },
    ctrlLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10, fontWeight: '500', letterSpacing: 0.4,
    },

    // End call
    endBtn: {
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: '#ef4444',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.18)',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 12,
    },
    endBtnIcon: { color: '#fff', fontSize: 24, fontWeight: '800' },
});

export default VideoCallScreen;