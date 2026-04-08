import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

if (Platform.OS === 'android') {
    const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
    const notifee = require('@notifee/react-native').default;
    const { AndroidImportance, AndroidVisibility, AndroidCategory, EventType } =
        require('@notifee/react-native');

    // ── Deduplication — ignore if same roomId already handled within 5s ──────
    let _lastHandledRoomId = null;
    let _lastHandledAt = 0;

    setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
        console.log('[BGHandler] fired — data:', JSON.stringify(remoteMessage?.data));

        const data = remoteMessage?.data;
        if (!data) return;

        // ── Cancel call received while app is killed ──────────────────────────
        if (data.type === 'cancel_call') {
            console.log('[BGHandler] cancel_call received — stopping ringtone & dismissing notification');
            // Stop RingtoneService — cancelAllNotifications alone does NOT stop it
            try {
                const { NativeModules } = require('react-native');
                NativeModules.IncomingCall?.stopRingtone?.();
            } catch (e) {
                console.log('[BGHandler] stopRingtone error:', e.message);
            }
            // Close CallActivity if it is visible
            try {
                const { NativeModules } = require('react-native');
                NativeModules.IncomingCall?.decline?.(data.roomId || '');
            } catch (e) {}
            await notifee.cancelAllNotifications();
            return;
        }

        if (data?.type !== 'incoming_call') return;

        const callerName = data.callerName || 'Unknown';
        const callerId   = data.callerId   || '';
        const roomId     = data.roomId     || '';

        // ── Deduplicate — FCM sometimes delivers the same message twice ───────
        const now = Date.now();
        if (roomId === _lastHandledRoomId && now - _lastHandledAt < 5000) {
            console.log('[BGHandler] duplicate — ignoring');
            return;
        }
        _lastHandledRoomId = roomId;
        _lastHandledAt = now;

        try {
            // Cancel any existing call notification first
            await notifee.cancelAllNotifications();

            // Silent channel — no sound/vibration here because CallActivity's
            // RingtoneService handles the looping ringtone and vibration.
            // Using a separate channel avoids the brief overlap of channel sound
            // starting at the same time as RingtoneService.
            await notifee.createChannel({
                id: 'incoming_call_silent',
                name: 'Incoming Calls',
                importance: AndroidImportance.HIGH,
                sound: '',       // no sound — RingtoneService handles audio
                vibration: false, // no vibration — RingtoneService handles vibration
            });

            await notifee.displayNotification({
                id: 'incoming_call',          // fixed ID so second call replaces first
                title: `📞 ${callerName} is calling`,
                body: 'Incoming video call — tap to answer',
                data: { type: 'incoming_call', callerId, callerName, roomId },
                android: {
                    channelId: 'incoming_call_silent',
                    importance: AndroidImportance.HIGH,
                    visibility: AndroidVisibility.PUBLIC,
                    category: AndroidCategory.CALL,
                    ongoing: true,
                    autoCancel: false,
                    timeoutAfter: 60000,
                    person: { name: callerName, important: true },
                    fullScreenAction: {
                        id: 'default',
                        launchActivity: 'com.flaychatbar.CallActivity',
                    },
                    pressAction: {
                        id: 'default',
                        launchActivity: 'com.flaychatbar.CallActivity',
                    },
                    actions: [
                        {
                            title: '✅ Answer',
                            // No launchActivity — onBackgroundEvent calls
                            // IncomingCallModule.answer() which opens MainActivity
                            // with action:'answer_call' extras so _checkNativePendingCall
                            // navigates straight to VideoCall (no IncomingCallScreen shown).
                            pressAction: { id: 'answer' },
                        },
                        {
                            title: '❌ Decline',
                            pressAction: { id: 'decline' },
                        },
                    ],
                },
            });

            console.log('[BGHandler] ✅ notification shown for room:', roomId);

            // Start ringtone immediately via native module.
            // fullScreenAction launches CallActivity (which also calls RingtoneService.start),
            // but on Android 14+ USE_FULL_SCREEN_INTENT may not be granted so CallActivity
            // might not auto-launch. Starting here ensures ringtone always plays.
            // RingtoneService.onStartCommand is idempotent — safe to call twice.
            try {
                const { NativeModules } = require('react-native');
                NativeModules.IncomingCall?.startRingtone?.();
            } catch (e) {
                console.log('[BGHandler] startRingtone error:', e.message);
            }

        } catch (err) {
            console.log('[BGHandler] ❌ Error:', err.message);
        }
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
        const data = detail?.notification?.data;
        if (!data || data.type !== 'incoming_call') return;

        if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'decline') {
            try {
                const { NativeModules } = require('react-native');
                NativeModules.IncomingCall?.stopRingtone?.();
            } catch (e) {}
            // Tell server call was declined so caller gets notified
            try {
                const { io } = require('socket.io-client');
                const { SOCKET_URL } = require('./utils/config');
                const tempSocket = io(SOCKET_URL, { transports: ['websocket'] });
                tempSocket.on('connect', () => {
                    tempSocket.emit('call-declined', { roomId: data.roomId });
                    setTimeout(() => tempSocket.disconnect(), 2000);
                });
            } catch (e) {}
            await notifee.cancelAllNotifications();
        }

        if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'answer') {
            // Use IncomingCallModule.answer() — this stops RingtoneService, sets
            // PendingCallStore, and opens MainActivity with action:'answer_call' extras.
            // _checkNativePendingCall() in App.js then navigates straight to VideoCall
            // WITHOUT showing IncomingCallScreen (since app is opened via explicit Intent,
            // not notification tap, getInitialNotification() returns null).
            try {
                const { NativeModules } = require('react-native');
                NativeModules.IncomingCall?.answer?.(
                    data?.callerName || '',
                    data?.callerId  || '',
                    data?.roomId    || ''
                );
            } catch (e) {}
            await notifee.cancelAllNotifications();
        }
    });
}