/**
 * IncomingCallScreen.js
 *
 * Premium full-screen incoming call UI — shown in two situations:
 *   1. App is OPEN — rendered inside the main app via UsersScreen
 *   2. App is KILLED — rendered standalone in IncomingCallActivity
 *
 * Props:
 *   callerName  {string}
 *   callerId    {string}
 *   roomId      {string}
 *   onAnswer    {function}
 *   onDecline   {function}
 *   standalone  {boolean}  — true when running in IncomingCallActivity
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Easing,
    StatusBar,
    Platform,
    NativeModules,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InCallManager from 'react-native-incall-manager';

const { width: SW, height: SH } = Dimensions.get('window');
const { IncomingCall } = NativeModules; // Android native bridge

const IncomingCallScreen = ({
    callerName = 'Unknown',
    callerId = '',
    roomId = '',
    onAnswer,
    onDecline,
    standalone = false,   // true when running in IncomingCallActivity (killed app)
}) => {
    const [callDuration, setCallDuration] = useState(0);

    // Animations
    const pulse1 = useRef(new Animated.Value(1)).current;
    const pulse2 = useRef(new Animated.Value(1)).current;
    const pulse3 = useRef(new Animated.Value(1)).current;
    const slideUp = useRef(new Animated.Value(80)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;
    const acceptAnim = useRef(new Animated.Value(1)).current;
    const declineAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Start ringtone
        InCallManager.startRingtone('_BUNDLE_');

        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeIn, {
                toValue: 1, duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(slideUp, {
                toValue: 0, tension: 60, friction: 10,
                useNativeDriver: true,
            }),
        ]).start();

        // Staggered pulse rings
        const makePulse = (anim, delay) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 2.5,
                        duration: 1600,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, { toValue: 1, duration: 0, useNativeDriver: true }),
                ])
            );

        const a1 = makePulse(pulse1, 0);
        const a2 = makePulse(pulse2, 500);
        const a3 = makePulse(pulse3, 1000);
        a1.start(); a2.start(); a3.start();

        // Pulsing accept button
        const acceptPulse = Animated.loop(
            Animated.sequence([
                Animated.timing(acceptAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
                Animated.timing(acceptAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            ])
        );
        acceptPulse.start();

        // Timer
        const timer = setInterval(() => setCallDuration(d => d + 1), 1000);

        return () => {
            InCallManager.stopRingtone();
            a1.stop(); a2.stop(); a3.stop();
            acceptPulse.stop();
            clearInterval(timer);
        };
    }, []);

    const handleAnswer = () => {
        InCallManager.stopRingtone();
        if (standalone && Platform.OS === 'android') {
            // Running in IncomingCallActivity — tell native to open main app
            IncomingCall?.answer(callerName, callerId, roomId);
        } else {
            onAnswer?.();
        }
    };

    const handleDecline = () => {
        InCallManager.stopRingtone();
        if (standalone && Platform.OS === 'android') {
            IncomingCall?.decline(roomId);
        } else {
            onDecline?.();
        }
    };

    const ringTime = callDuration < 60
        ? `Ringing... ${callDuration}s`
        : `Ringing... ${Math.floor(callDuration / 60)}m ${callDuration % 60}s`;

    const initials = callerName
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <View style={S.root}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Background — deep dark with subtle gradient feel */}
            <View style={S.bg} />
            <View style={S.bgOverlay} />

            <Animated.View style={[S.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

                {/* ── Top section ── */}
                <SafeAreaView style={S.top}>
                    <Text style={S.incomingLabel}>INCOMING VIDEO CALL</Text>

                    {/* Avatar with pulse rings */}
                    <View style={S.avatarContainer}>
                        <Animated.View style={[S.ring, S.ring3, { transform: [{ scale: pulse3 }], opacity: pulse3.interpolate({ inputRange: [1, 2.5], outputRange: [0.25, 0] }) }]} />
                        <Animated.View style={[S.ring, S.ring2, { transform: [{ scale: pulse2 }], opacity: pulse2.interpolate({ inputRange: [1, 2.5], outputRange: [0.35, 0] }) }]} />
                        <Animated.View style={[S.ring, S.ring1, { transform: [{ scale: pulse1 }], opacity: pulse1.interpolate({ inputRange: [1, 2.5], outputRange: [0.45, 0] }) }]} />

                        <View style={S.avatar}>
                            <Text style={S.avatarText}>{initials}</Text>
                        </View>

                        {/* Video call badge */}
                        <View style={S.videoBadge}>
                            <Text style={S.videoBadgeText}>📹</Text>
                        </View>
                    </View>

                    <Text style={S.callerName}>{callerName}</Text>
                    <Text style={S.ringStatus}>{ringTime}</Text>
                </SafeAreaView>

                {/* ── Swipe hint ── */}
                <View style={S.swipeHint}>
                    <View style={S.swipeBar} />
                </View>

                {/* ── Bottom controls ── */}
                <SafeAreaView edges={['bottom']} style={S.bottom}>

                    {/* Remind me */}
                    <TouchableOpacity style={S.secondaryBtn} activeOpacity={0.7}>
                        <Text style={S.secondaryIcon}>🔕</Text>
                        <Text style={S.secondaryLabel}>Remind me</Text>
                    </TouchableOpacity>

                    {/* Main buttons row */}
                    <View style={S.mainBtnsRow}>

                        {/* Decline */}
                        <View style={S.btnWrap}>
                            <TouchableOpacity
                                style={[S.circleBtn, S.declineBtn]}
                                onPress={handleDecline}
                                activeOpacity={0.85}
                            >
                                <Text style={S.btnIcon}>📵</Text>
                            </TouchableOpacity>
                            <Text style={S.btnLabel}>Decline</Text>
                        </View>

                        {/* Accept — pulsing green */}
                        <View style={S.btnWrap}>
                            <Animated.View style={{ transform: [{ scale: acceptAnim }] }}>
                                <TouchableOpacity
                                    style={[S.circleBtn, S.acceptBtn]}
                                    onPress={handleAnswer}
                                    activeOpacity={0.85}
                                >
                                    <Text style={S.btnIcon}>📞</Text>
                                </TouchableOpacity>
                            </Animated.View>
                            <Text style={S.btnLabel}>Accept</Text>
                        </View>

                    </View>

                    {/* Message shortcut */}
                    <TouchableOpacity style={S.secondaryBtn} activeOpacity={0.7}>
                        <Text style={S.secondaryIcon}>💬</Text>
                        <Text style={S.secondaryLabel}>Message</Text>
                    </TouchableOpacity>

                </SafeAreaView>
            </Animated.View>
        </View>
    );
};

const GREEN = '#25d366';
const RED = '#ff3b30';
const DARK = '#0a0a0f';

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: DARK },
    bg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0d1117',
    },
    bgOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(37,211,102,0.04)',
    },
    content: { flex: 1 },

    // Top
    top: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
    },
    incomingLabel: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 3,
        marginBottom: 40,
    },

    // Avatar
    avatarContainer: {
        width: 160, height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    ring: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: GREEN,
    },
    ring1: { width: 140, height: 140 },
    ring2: { width: 150, height: 150 },
    ring3: { width: 160, height: 160 },
    avatar: {
        width: 116, height: 116,
        borderRadius: 58,
        backgroundColor: '#1a2a1a',
        borderWidth: 3,
        borderColor: GREEN,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: GREEN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
    },
    avatarText: {
        fontSize: 42, color: '#fff',
        fontWeight: '800', letterSpacing: -1,
    },
    videoBadge: {
        position: 'absolute',
        bottom: 4, right: 4,
        width: 34, height: 34,
        borderRadius: 17,
        backgroundColor: '#222',
        borderWidth: 2, borderColor: GREEN,
        alignItems: 'center', justifyContent: 'center',
    },
    videoBadgeText: { fontSize: 16 },

    callerName: {
        fontSize: 34, color: '#fff',
        fontWeight: '700', letterSpacing: 0.3,
        marginBottom: 10,
    },
    ringStatus: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 0.5,
    },

    swipeHint: { alignItems: 'center', paddingVertical: 16 },
    swipeBar: {
        width: 40, height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },

    // Bottom
    bottom: {
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    mainBtnsRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginVertical: 24,
    },
    btnWrap: { alignItems: 'center', gap: 10 },
    circleBtn: {
        width: 80, height: 80, borderRadius: 40,
        alignItems: 'center', justifyContent: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    declineBtn: {
        backgroundColor: RED,
        shadowColor: RED,
    },
    acceptBtn: {
        backgroundColor: GREEN,
        shadowColor: GREEN,
    },
    btnIcon: { fontSize: 32 },
    btnLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13, fontWeight: '500',
    },

    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    secondaryIcon: { fontSize: 18 },
    secondaryLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13, fontWeight: '500',
    },
});

export default IncomingCallScreen;