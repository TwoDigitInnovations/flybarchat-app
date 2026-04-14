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
    Image,
    NativeModules,
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
import IncomingCallScreen from './IncommingCallScreen';
import { SOCKET_URL } from '../../../utils/config';
import { TURN_CREDENTIAL } from '../../../utils/config';
import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import { Call2Icon, Camera3Icon, CameraCloseIcon, ExchangeIcon, Mic2Icon, MicCloseIcon, MusicIcon, SpeakerCloseIcon, SpeakerIcon } from '../../Assets/theme';

const { IncomingCall } = NativeModules;

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

const CALL_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const { width: SW, height: SH } = Dimensions.get('window');
// ─────────────────────────────────────────────────────────────────────────────

const VideoCallScreen = ({
    roomId = 'room-1',
    calleeId = 'user-2',
    calleeName = 'Remote User',
    isInitiator = null,
    onHangup,
}) => {

    // ── ALL STATE declared together at the top ─────────────────────────────────
    const [callStatus, setCallStatus] = useState('idle');
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [incomingCall, setIncomingCall] = useState(null);

    // Timer state — declared with callStatus so they're all in scope together
    const [timeLeft, setTimeLeft] = useState(CALL_DURATION_MS);
    const [showTimeOverlay, setShowTimeOverlay] = useState(false);
    const [isTimeOver, setIsTimeOver] = useState(false);

    // GIF state
    const [gifPhase, setGifPhase] = useState('playing');

    // ── Redux ──────────────────────────────────────────────────────────────────
    const user = useSelector(state => state.auth.user);
    const userId = user?._id || 'user-1';
    const callerName = user?.name || 'Me';

    // ── Refs ───────────────────────────────────────────────────────────────────
    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const remoteDescSetRef = useRef(false);
    const isMountedRef = useRef(true);
    const callStartedRef = useRef(false);
    const isInitiatorRef = useRef(false);
    const timerRef = useRef(null);
    const hangupTimerRef = useRef(null);
    const hangupRef = useRef(null);       // always points to latest hangup fn
    const callDeclinedRef = useRef(false); // prevents duplicate call-declined handling

    // ── GIF assets ────────────────────────────────────────────────────────────
    const GIF_REQUIRE = require('../../Assets/Gif/Drink.gif');
    const GIF_SOURCE = Image.resolveAssetSource(GIF_REQUIRE);
    const GIF_DURATION_MS = 10000;

    // ── Animation refs ─────────────────────────────────────────────────────────
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const controlsAnim = useRef(new Animated.Value(1)).current;
    const connectAnim = useRef(new Animated.Value(0)).current;
    const gifOpacity = useRef(new Animated.Value(1)).current;
    const gifScale = useRef(new Animated.Value(1)).current;

    const SCREEN_W = SW;
    const SCREEN_H = SH;
    const PIP_W = 110;
    const PIP_H = 165;

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
            onPanResponderRelease: () => {
                pipPos.flattenOffset();
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

    const log = useCallback((...args) => console.log('[VideoCall]', ...args), []);
    const safeSet = useCallback((fn) => { if (isMountedRef.current) fn(); }, []);
    const safeSetState = useCallback((setter) => { if (isMountedRef.current) setter(); }, []);

    // ══════════════════════════════════════════════════════════════════════════
    // GIF OVERLAY — FIX: do NOT set isMountedRef.current = false in GIF effect
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        // Receiver skips GIF entirely
        if (!isInitiator) {
            setGifPhase('done');
            return;
        }

        // Caller: play GIF for GIF_DURATION_MS then fade out
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(gifOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
                Animated.timing(gifScale, { toValue: 1.08, duration: 500, useNativeDriver: true }),
            ]).start(() => {
                safeSet(() => setGifPhase('done'));
            });
        }, GIF_DURATION_MS);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── gifPhase='done' → start or answer call ─────────────────────────────────
    useEffect(() => {
        if (gifPhase !== 'done') return;
        if (callStartedRef.current) return;

        const delay = Platform.OS === 'android' ? 500 : 100;

        if (isInitiator === true) {
            const t = setTimeout(() => startCall(), delay);
            return () => clearTimeout(t);
        } else {
            const t = setTimeout(() => answerCall(roomId), delay);
            return () => clearTimeout(t);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gifPhase]);

    // ══════════════════════════════════════════════════════════════════════════
    // COUNTDOWN TIMER — starts when callStatus becomes 'connected'
    // FIX: callStatus is now declared BEFORE this effect so it works correctly
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (callStatus !== 'connected') return;

        // Clear any existing timer first
        if (timerRef.current) clearInterval(timerRef.current);
        if (hangupTimerRef.current) clearTimeout(hangupTimerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1000) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    // Use timeout to avoid setState inside setState
                    setTimeout(() => {
                        safeSet(() => {
                            setIsTimeOver(true);
                            setShowTimeOverlay(true);
                        });
                        // Auto-hangup after 30s grace period (give user time to purchase)
                        hangupTimerRef.current = setTimeout(() => hangup(), 30000);
                    }, 0);
                    return 0;
                }
                const next = prev - 1000;
                // Show warning overlay at 60 seconds remaining
                if (next <= 60000 && next > 0) {
                    setTimeout(() => safeSet(() => setShowTimeOverlay(true)), 0);
                }
                return next;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callStatus]);

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

    // ── Android Activity guard ────────────────────────────────────────────────
    const isActivityReadyRef = useRef(Platform.OS !== 'android');

    useEffect(() => {
        if (Platform.OS !== 'android') return;
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') isActivityReadyRef.current = true;
        });
        if (AppState.currentState === 'active') isActivityReadyRef.current = true;
        return () => sub.remove();
    }, []);

    // ══════════════════════════════════════════════════════════════════════════
    // STARTUP — register user + OneSignal
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        isMountedRef.current = true;

        const timer = setTimeout(async () => {
            await registerUserWithServer(userId, callerName);

            const playerId = OneSignal.User.pushSubscription.id;
            if (playerId) {
                log('OneSignal Player ID:', playerId);
                registerPlayerIdWithServer(userId, playerId);
            }

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
            if (timerRef.current) clearInterval(timerRef.current);
            if (hangupTimerRef.current) clearTimeout(hangupTimerRef.current);
        };
    }, [userId]);

    // ── Server registration helpers ───────────────────────────────────────────
    const registerUserWithServer = async (uid, name) => {
        try {
            await fetch(`${SIGNALING_SERVER_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: uid, name }),
            });
            log('User registered:', uid, name);
        } catch (err) { log('User registration error:', err.message); }
    };

    const registerPlayerIdWithServer = async (uid, playerId) => {
        try {
            const res = await fetch(`${SIGNALING_SERVER_URL}/register-player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: uid, playerId }),
            });
            const data = await res.json();
            log('Player ID registered:', data);
        } catch (err) { log('Player registration error:', err.message); }
    };

    const sendCallNotification = useCallback(async () => {
        try {
            const res = await fetch(`${SIGNALING_SERVER_URL}/notify-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callerId: userId, callerName, calleeId, roomId }),
            });
            const data = await res.json();
            log('Call notification sent:', data);
        } catch (err) { log('Send notification error:', err.message); }
    }, [userId, callerName, calleeId, roomId, log]);

    const cancelCallNotification = useCallback(async () => {
        try {
            await fetch(`${SIGNALING_SERVER_URL}/cancel-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calleeId, roomId }),
            });
        } catch (err) { log('Cancel notification error:', err.message); }
    }, [calleeId, roomId, log]);

    // ── Timer helpers ─────────────────────────────────────────────────────────
    const formatTime = (ms) => {
        const totalSecs = Math.max(0, Math.floor(ms / 1000));
        const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');
        return { mins, secs };
    };

    const handlePurchaseDrink = useCallback(() => {
        // Clear any pending auto-hangup
        if (hangupTimerRef.current) {
            clearTimeout(hangupTimerRef.current);
            hangupTimerRef.current = null;
        }
        // Extend by 10 minutes and reset overlay
        setTimeLeft(CALL_DURATION_MS);
        setShowTimeOverlay(false);
        setIsTimeOver(false);
        // TODO: wire to your in-app purchase / API
    }, []);

    const handleDedicateSong = useCallback(() => {
        // TODO: open song dedication flow
        Alert.alert('Dedicate a Song', 'Song dedication coming soon!');
    }, []);

    // ── WebRTC helpers ────────────────────────────────────────────────────────
    const requestAndroidPermissions = useCallback(async () => {
        if (Platform.OS !== 'android') return true;
        try {
            const cameraGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
            const audioGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            if (cameraGranted && audioGranted) return true;

            let waited = 0;
            while (!isActivityReadyRef.current && waited < 8000) {
                await new Promise(r => setTimeout(r, 200));
                waited += 200;
            }
            if (!isActivityReadyRef.current) return cameraGranted && audioGranted;
            await new Promise(r => setTimeout(r, 400));

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
            return false;
        }
    }, [log]);

    const getLocalStream = useCallback(async () => {
        if (Platform.OS === 'android') {
            const granted = await requestAndroidPermissions();
            if (!granted) return null;
        }
        try {
            const stream = await mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
            });
            stream.getAudioTracks().forEach(t => { t.enabled = true; });
            if (Platform.OS === 'android' && NativeModules.BarWebRTC) {
                setTimeout(() => {
                    NativeModules.BarWebRTC.activateBarBackground()
                        .then(() => log('[Bar] Background activated'))
                        .catch(e => log('[Bar] activate error:', e.message));
                }, 500);
            }
            return stream;
        } catch (err) {
            log('getUserMedia error:', err);
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
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

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
        // Clear timers
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (hangupTimerRef.current) { clearTimeout(hangupTimerRef.current); hangupTimerRef.current = null; }

        InCallManager.stop();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
        if (socketRef.current) {
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
            if (isActivityReadyRef.current) Alert.alert('Connection error', 'Could not connect to the signaling server.');
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
            if (!stream) { log('ERROR: No local stream when peer joined'); return; }
            pcRef.current || createPeerConnection(stream);
            setTimeout(() => sendOffer(), 100);
        });
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('call-declined', () => {
            // Guard: FCM + socket can both deliver this event; only handle once
            if (callDeclinedRef.current) return;
            callDeclinedRef.current = true;
            if (isActivityReadyRef.current) {
                Alert.alert('Call Declined', `${calleeName} declined the call.`, [
                    { text: 'OK', onPress: () => hangupRef.current?.() },
                ]);
            } else {
                hangupRef.current?.();
            }
        });
        socket.on('call-cancelled', () => {
            safeSetState(() => setIncomingCall(null));
            InCallManager.stopRingtone();
        });
        socket.on('peer-left', () => { log('Peer left'); hangup(); });
        socket.on('disconnect', (reason) => log('Socket disconnected:', reason));
    }, [
        userId, calleeName, createPeerConnection, sendOffer,
        handleOffer, handleAnswer, handleIceCandidate,
        cleanupCall, safeSetState, log,
    ]);

    // ── START CALL ────────────────────────────────────────────────────────────
    const startCall = useCallback(async () => {
        if (callStartedRef.current) return;
        callStartedRef.current = true;
        callDeclinedRef.current = false; // reset for fresh call
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
        await sendCallNotification();
        connectSocket(roomId);
    }, [getLocalStream, sendCallNotification, connectSocket, roomId, safeSetState]);

    // ── ANSWER CALL ───────────────────────────────────────────────────────────
    const answerCall = useCallback(async (incomingRoomId) => {
        safeSetState(() => setIncomingCall(null));
        if (callStartedRef.current) return;
        callStartedRef.current = true;
        callDeclinedRef.current = false; // reset for fresh call
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

    // ── DECLINE CALL ──────────────────────────────────────────────────────────
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
        if (isMountedRef.current) {
            setLocalStream(null);
            setRemoteStream(null);
            setCallStatus('idle');
            setIsMuted(false);
            setIsCameraOff(false);
            setIsFrontCamera(true);
            setIsSpeakerOn(true);
            setIncomingCall(null);
            setTimeLeft(CALL_DURATION_MS);
            setShowTimeOverlay(false);
            setIsTimeOver(false);
        }
        onHangup?.();
    }, [cleanupCall, cancelCallNotification, onHangup, log]);

    // Keep ref in sync so connectSocket's closure can call the latest hangup
    useEffect(() => { hangupRef.current = hangup; }, [hangup]);

    // ── In-call controls ───────────────────────────────────────────────────────
    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        safeSetState(() => setIsMuted(prev => !prev));
    }, [safeSetState]);

    const toggleCamera = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
        safeSetState(() => setIsCameraOff(prev => !prev));
    }, [safeSetState]);

    const switchCamera = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack?._switchCamera) {
            videoTrack._switchCamera();
            safeSetState(() => setIsFrontCamera(prev => !prev));
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
        idle: '', starting: 'Starting…', waiting: waitingLabel,
        connecting: 'Connecting…', connected: 'Connected', ended: 'Call Ended',
    }[callStatus] ?? '';
    const remoteName = calleeName;
    const { mins, secs } = formatTime(timeLeft);

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
    // MAIN RENDER
    // ══════════════════════════════════════════════════════════════════════════
    return (
        <View style={S.root}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* ── 1. Bar background ── */}
            <Image
                source={require('../../Assets/Images/bar_bg_1.png')}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            />

            {/* ── 2. Remote video ── */}
            {remoteStream ? (
                <RTCView
                    streamURL={remoteStream.toURL()}
                    style={StyleSheet.absoluteFillObject}
                    objectFit="cover"
                    mirror={false}
                    zOrder={0}
                />
            ) : (
                <View style={StyleSheet.absoluteFillObject}>
                    <Image
                        source={require('../../Assets/Images/bar_bg_1.png')}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                    />
                    <View style={S.waitBg}>
                        <Animated.View style={[S.glowRing, S.glowRing3]} />
                        <Animated.View style={[S.glowRing, S.glowRing2, { transform: [{ scale: pulseAnim }] }]} />
                        <Animated.View style={[S.glowRing, S.glowRing1, { transform: [{ scale: pulseAnim }] }]} />
                        {/* <View style={S.waitAvatar}>
                            <Text style={S.waitAvatarText}>{remoteName.charAt(0).toUpperCase()}</Text>
                        </View> */}
                        <Text style={S.waitName}>{remoteName}</Text>
                        <Text style={S.waitStatus}>{statusLabel}</Text>
                        {callStatus === 'starting' && (
                            <ActivityIndicator color="rgba(255,255,255,0.5)" style={{ marginTop: 14 }} />
                        )}
                    </View>
                </View>
            )}

            {/* ── 3. Bar table overlay ── */}
            {remoteStream &&<Image
                source={require('../../Assets/Images/bar_table.png')}
                style={S.tableOverlay}
                resizeMode="stretch"
            />}

            {/* ── Gradient overlays ── */}
            {/* <View style={S.topGradient} pointerEvents="none" />
            <View style={S.bottomGradient} pointerEvents="none" /> */}

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
                    {/* <TouchableOpacity style={S.hudIconBtn} onPress={toggleSpeaker} activeOpacity={0.7}>
                        <Text style={S.hudIconText}>{isSpeakerOn ? '🔊' : '🔇'}</Text>
                    </TouchableOpacity> */}
                    <View style={{ width: 58 }} /> 
                </View>
            </SafeAreaView>

            {/* ── Draggable PiP — local video ── */}
            {localStream  && (
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
                            <CameraCloseIcon />
                        </View>
                    )}
                    {/* <TouchableOpacity style={S.pipFlipBtn} onPress={switchCamera} activeOpacity={0.75}>
                        <Text style={{ fontSize: 12 }}>🔃</Text>
                    </TouchableOpacity> */}
                </Animated.View>
            )}

            {/* ── Bottom controls ── */}
            <Animated.View style={[S.controlsDock, { opacity: controlsAnim }]}>
                <SafeAreaView edges={['bottom']}>
                    <View style={S.controlsRow}>
                        <View style={S.ctrlWrap}>
                            <TouchableOpacity style={[S.ctrlBtn, isMuted && S.ctrlBtnRed]} onPress={toggleMute} activeOpacity={0.75}>
                                <Text style={S.ctrlIcon}>{isMuted ? <MicCloseIcon /> : <Mic2Icon />}</Text>
                            </TouchableOpacity>
                            {/* <Text style={S.ctrlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text> */}
                        </View>
                        <View style={S.ctrlWrap}>
                            <TouchableOpacity style={[S.ctrlBtn, isCameraOff && S.ctrlBtnRed]} onPress={toggleCamera} activeOpacity={0.75}>
                                <Text style={S.ctrlIcon}>{isCameraOff ? <CameraCloseIcon /> : <Camera3Icon />}</Text>
                            </TouchableOpacity>
                            {/* <Text style={S.ctrlLabel}>{isCameraOff ? 'Start Cam' : 'Stop Cam'}</Text> */}
                        </View>
                        <View style={S.ctrlWrap}>
                            <TouchableOpacity style={S.endBtn} onPress={hangup} activeOpacity={0.85}>
                                <Call2Icon />
                            </TouchableOpacity>
                            {/* <Text style={S.ctrlLabel}>End</Text> */}
                        </View>
                        <View style={S.ctrlWrap}>
                            <TouchableOpacity style={[S.ctrlBtn, !isSpeakerOn && S.ctrlBtnRed]} onPress={toggleSpeaker} activeOpacity={0.75}>
                                <Text style={S.ctrlIcon}>{isSpeakerOn ? <SpeakerIcon /> : <SpeakerCloseIcon />}</Text>
                            </TouchableOpacity>
                            {/* <Text style={S.ctrlLabel}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text> */}
                        </View>
                        <View style={S.ctrlWrap}>
                            <TouchableOpacity style={S.ctrlBtn} onPress={switchCamera} activeOpacity={0.75}>
                                <ExchangeIcon />
                            </TouchableOpacity>
                            {/* <Text style={S.ctrlLabel}>Flip</Text> */}
                        </View>
                    </View>
                </SafeAreaView>
            </Animated.View>

            {/* ── GIF overlay (caller only, plays before call starts) ── */}
            {gifPhase === 'playing' && isInitiator && (
                <Animated.View
                    pointerEvents="none"
                    style={[S.gifOverlay, { opacity: gifOpacity, transform: [{ scale: gifScale }] }]}
                >
                    <FastImage
                        source={{ uri: GIF_SOURCE.uri, priority: FastImage.priority.high }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode={FastImage.resizeMode.cover}
                    />
                </Animated.View>
            )}

            {/* ── Small timer pill (visible during connected call, before overlay) ── */}
            {callStatus === 'connected' && !showTimeOverlay && (
                <View style={S.timerPill}>
                    <Text style={S.timerPillText}>⏱ {mins}:{secs}</Text>
                </View>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TIME OVERLAY — matches the screenshot design exactly
                Shows over the remote video (which is still playing behind)
            ════════════════════════════════════════════════════════════════ */}

            {showTimeOverlay && (
                <View style={S.timeOverlayRoot}>
                    {/* Semi-transparent dark wash over the video */}
                    <View />

                    <View style={S.timeOverlayContent}>
                        {/* ── Clock digits ── */}
                        <View style={S.clockRow}>
                            <View style={S.clockBlock}>
                                <Text style={S.clockDigit}>{mins}</Text>
                                <Text style={S.clockUnit}>MINUTES</Text>
                            </View>
                            <Text style={S.clockColon}>:</Text>
                            <View style={S.clockBlock}>
                                <Text style={S.clockDigit}>{secs}</Text>
                                <Text style={S.clockUnit}>SECONDS</Text>
                            </View>
                        </View>


                        {/* ── Warning banner (< 60s but not yet 0) ── */}
                        {/* {!isTimeOver && (
                            <View style={S.warningBadge}>
                                <Text style={S.warningBadgeText}>⚠️  Less than a minute left!</Text>
                            </View>
                        )} */}

                        {/* ── Subtitle ── */}
                        <Text style={S.timeSubtitle}>
                            {isTimeOver
                                ? 'Purchase a drink to extend the call time\nby 10 minutes'
                                : 'Purchase a drink to extend the call\ntime by 10 minutes'}
                        </Text>

                        {/* ── Purchase drink button ── */}
                        <TouchableOpacity style={S.timeActionBtn} onPress={handlePurchaseDrink} activeOpacity={0.82}>
                            <Text style={S.timeActionIcon}>🍷</Text>
                            <Text style={S.timeActionText}>Purchase Another Drink</Text>
                        </TouchableOpacity>

                        {/* ── Dedicate song button ── */}
                        <TouchableOpacity style={S.timeActionBtn} onPress={handleDedicateSong} activeOpacity={0.82}>
                            <MusicIcon height={20} width={20} color={Constants.white}/>
                            <Text style={S.timeActionText}>Dedicate a song</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: Constants.light_black },

    gifOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
        backgroundColor: '#000',
    },

    // ── Waiting screen ─────────────────────────────────────────────────────────
    waitBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Constants.light_black,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowRing: { position: 'absolute', borderRadius: 9999, borderWidth: 1.5 },
    glowRing1: { width: 156, height: 156, borderColor: Constants.black, backgroundColor: Constants.light_pink },
    glowRing2: { width: 240, height: 240, borderColor: Constants.light_pink, backgroundColor: 'transparent' },
    glowRing3: { width: 330, height: 330, borderColor: Constants.light_pink, backgroundColor: 'transparent' },
    waitAvatar: {
        width: 112, height: 112, borderRadius: 56,
        backgroundColor: 'rgba(56,189,248,0.12)',
        borderWidth: 2, borderColor: 'rgba(56,189,248,0.45)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 22,
        shadowColor: '#38bdf8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 20, elevation: 8,
    },
    waitAvatarText: { fontSize: 46, color: '#fff', fontWeight: '700', letterSpacing: -1 },
    waitName: { fontSize: 28, color: Constants.black, fontWeight: '600', letterSpacing: 0.2, marginBottom: 10 },
    waitStatus: { fontSize: 13, color: Constants.black, letterSpacing: 2.5, textTransform: 'uppercase' },

    // ── Gradients ──────────────────────────────────────────────────────────────
    topGradient: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 180,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderBottomWidth: 80, borderBottomColor: 'transparent', overflow: 'hidden',
    },
    bottomGradient: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 240,
        backgroundColor: 'rgba(0,0,0,0.62)',
    },

    // ── Top HUD ────────────────────────────────────────────────────────────────
    topHud: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    hudRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 44 : 14,
        paddingBottom: 10, gap: 10,
    },
    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        // backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1, borderColor: Constants.black,
    },
    statusPillLive: { borderColor: 'rgba(16,185,129,0.5)' },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981' },
    statusPillText: { color: Constants.black, fontSize: 10, fontFamily:FONTS.SemiBold, letterSpacing: 1 },
    hudName: { flex: 1, color: Constants.black, fontSize: 16, fontFamily:FONTS.Medium, textAlign: 'center', letterSpacing: 0.2 },
    hudIconBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    hudIconText: { fontSize: 16 },

    // ── PiP ────────────────────────────────────────────────────────────────────
    pip: {
        position: 'absolute', width: 110, height: 165,
        borderRadius: 20, overflow: 'hidden', zIndex: 20,
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.22)',
        // shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        // shadowOpacity: 0.7, shadowRadius: 20, elevation: 14,
    },
    pipVideo: { width: '100%', height: '100%', overflow: 'hidden' },
    pipOff: { width: '100%', height: '100%', backgroundColor: Constants.light_pink2, alignItems: 'center', justifyContent: 'center' },
    pipFlipBtn: {
        position: 'absolute', bottom: 6, right: 6,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
    },

    // ── Controls dock ──────────────────────────────────────────────────────────
    controlsDock: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15 },
    controlsRow: {
        flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-end',
        paddingHorizontal: 8, paddingTop: 20,
        paddingBottom: Platform.OS === 'android' ? 28 : 10,
    },
    ctrlWrap: { alignItems: 'center', gap: 6 },
    ctrlBtn: {
        width: 58, height: 58, borderRadius: 29,
        backgroundColor: '#a893a0',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
    },
    // ctrlBtnRed: { backgroundColor: 'rgba(239,68,68,0.3)', borderColor: 'rgba(239,68,68,0.55)' },
    ctrlIcon: { fontSize: 22 },
    ctrlLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '500', letterSpacing: 0.4 },
    endBtn: {
        width: 58, height: 58, borderRadius: 35, backgroundColor: '#F62E2F',
        alignItems: 'center', justifyContent: 'center',
        // borderWidth: 3, borderColor: 'rgba(255,255,255,0.18)',
        shadowColor: '#ef4444', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6, shadowRadius: 16, elevation: 12,
    },
    endBtnIcon: { color: '#fff', fontSize: 24, fontWeight: '800' },

    tableOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '30%', zIndex: 5, width: '100%',
    },

    // ── Small timer pill (always visible during connected call) ────────────────
    timerPill: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 92 : 112,
        alignSelf: 'center',
        backgroundColor: Constants.light_pink,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Constants.black,
        zIndex: 12,
    },
    timerPillText: {
        color: Constants.black,
        fontSize: 13,
        fontFamily:FONTS.SemiBold,
        letterSpacing: 2,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // TIME OVERLAY — full screen, sits above video feed
    // ══════════════════════════════════════════════════════════════════════════
    timeOverlayRoot: {
        // ...StyleSheet.absoluteFillObject,
        zIndex: 60,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute', 
        bottom: 120,
    },
    // Translucent dark scrim so video is visible but dimmed (matches screenshot)
    timeOverlayScrim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    timeOverlayContent: {
        width: SW,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
    },

    // ── Clock ──────────────────────────────────────────────────────────────────
    clockRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        // gap: 2,
        marginBottom: 8,
    },
    clockBlock: { alignItems: 'center' },
    clockDigit: {
        fontSize: 32,
        fontFamily:FONTS.SemiBold,
        color: Constants.white,
        // letterSpacing: -3,
        lineHeight: 92,
    },
    clockUnit: {
        fontSize: 9,
        fontFamily:FONTS.SemiBold,
        letterSpacing: 3,
        color: Constants.white,
        marginTop: -10,
        textDecorationLine: 'underline',
        textDecorationColor: 'rgba(255,255,255,0.3)',
    },
    clockColon: {
        fontSize: 28,
        fontFamily:FONTS.SemiBold,
        color: Constants.white,
        lineHeight: 92,
        marginTop: 0,
    },

    // ── "Time Over" pink ribbon ────────────────────────────────────────────────
    ribbonWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 4,
        width: SW * 0.82,
    },
    ribbonEarLeft: {
        width: 0, height: 0,
        borderTopWidth: 20, borderTopColor: 'transparent',
        borderBottomWidth: 20, borderBottomColor: 'transparent',
        borderRightWidth: 18, borderRightColor: '#d63a7a',
    },
    ribbonCenter: {
        flex: 1,
        backgroundColor: '#d63a7a',
        paddingVertical: 9,
        alignItems: 'center',
    },
    ribbonText: {
        color: '#fff',
        fontSize: 19,
        fontWeight: '700',
        letterSpacing: 0.5,
        fontStyle: 'italic',
    },
    ribbonEarRight: {
        width: 0, height: 0,
        borderTopWidth: 20, borderTopColor: 'transparent',
        borderBottomWidth: 20, borderBottomColor: 'transparent',
        borderLeftWidth: 18, borderLeftColor: '#d63a7a',
    },

    // ── Warning badge (< 60s, not yet 0) ──────────────────────────────────────
    warningBadge: {
        backgroundColor: 'rgba(239,68,68,0.25)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.5)',
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 7,
        marginBottom: 18,
        marginTop: 4,
    },
    warningBadgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.3,
    },

    // ── Subtitle ───────────────────────────────────────────────────────────────
    timeSubtitle: {
        color: Constants.white,
        fontSize: 16,
        fontFamily:FONTS.Inter_Medium,
        textAlign: 'center',
        // lineHeight: 26,
        marginBottom: 10,
        paddingHorizontal: 10,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },

    // ── Action buttons ─────────────────────────────────────────────────────────
    timeActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FFFCFC4D',
        // borderWidth: 1.5,
        // borderColor: 'rgba(255,255,255,0.35)',
        borderRadius: 50,
        paddingHorizontal: 10,
        paddingVertical: 8,
        width: SW * 0.8,
        marginBottom: 14,
        // Frosted glass look
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.3,
        // shadowRadius: 12,
        // elevation: 6,
    },
    timeActionIcon: { fontSize: 20 },
    timeActionText: {
        color: Constants.white,
        fontSize: 14,
        fontFamily: FONTS.SemiBold,
        letterSpacing: 0.2,
    },
});

export default VideoCallScreen;