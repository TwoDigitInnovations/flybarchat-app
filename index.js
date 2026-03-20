import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

if (Platform.OS === 'android') {
    const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
    const notifee = require('@notifee/react-native').default;
    const {
        AndroidImportance,
        AndroidVisibility,
        AndroidCategory,
        EventType,
    } = require('@notifee/react-native');

    // index.js — force recreate channel
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
    console.log('[BGHandler] ===== FIRED =====');
    console.log('[BGHandler] data:', JSON.stringify(remoteMessage?.data));

    const data = remoteMessage?.data;
    if (data?.type !== 'incoming_call') {
        console.log('[BGHandler] Not a call — ignoring');
        return;
    }

    console.log('[BGHandler] Showing Notifee notification...');

    const callerName = data.callerName || 'Unknown';
    const callerId = data.callerId || '';
    const roomId = data.roomId || '';

    try {
        await notifee.cancelAllNotifications();
        console.log('[BGHandler] Cancelled old notifications');

        await notifee.deleteChannel('incoming_call_v3');
        await notifee.createChannel({
            id: 'incoming_call_v3',
            name: 'Incoming Calls',
            importance: AndroidImportance.HIGH,
            sound: 'ringtone',
            vibration: true,
            vibrationPattern: [500, 500, 500, 500],
        });
        console.log('[BGHandler] Channel created');

        const notifId = await notifee.displayNotification({
            title: `📞 ${callerName} is calling`,
            body: 'Tap to answer the video call',
            data: { type: 'incoming_call', callerId, callerName, roomId },
            android: {
                channelId: 'incoming_call_v3',
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                category: AndroidCategory.CALL,
                sound: 'ringtone',
                vibrationPattern: [500, 500, 500, 500],
                ongoing: true,
                autoCancel: false,
                timeoutAfter: 60000,
                person: {
                    name: callerName,
                    important: true,
                },
                fullScreenAction: {
                    id: 'default',
                    launchActivity: 'com.flaychatbar.MainActivity',
                },
                pressAction: {
                    id: 'default',
                    launchActivity: 'com.flaychatbar.MainActivity',
                },
                actions: [
                    {
                        title: '✅ Answer',
                        pressAction: {
                            id: 'answer',
                            launchActivity: 'com.flaychatbar.MainActivity',
                        },
                    },
                    {
                        title: '❌ Decline',
                        pressAction: { id: 'decline' },
                    },
                ],
            },
        });
        console.log('[BGHandler] ✅ Notification shown, id:', notifId);

    } catch (err) {
        console.log('[BGHandler] ❌ Error:', err.message);
    }
});

    // index.js — onBackgroundEvent
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const data = detail?.notification?.data;
    if (!data || data.type !== 'incoming_call') return;

    if (type === EventType.PRESS) {
        // ✅ Just tap on notification body — show IncomingCallScreen
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('pendingCall', JSON.stringify({
            callerName: data.callerName,
            callerId: data.callerId,
            roomId: data.roomId,
            action: 'show', // ← show IncomingCallScreen
        }));
        await notifee.cancelNotification(detail.notification.id);
    }

    if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'answer') {
        // ✅ Answer button — go directly to VideoCall
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('pendingCall', JSON.stringify({
            callerName: data.callerName,
            callerId: data.callerId,
            roomId: data.roomId,
            action: 'answer', // ← go directly to VideoCall
        }));
        await notifee.cancelNotification(detail.notification.id);
    }

    if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'decline') {
        // ✅ Decline — just emit and cancel, don't open app
        try {
            const { socket } = require('./utils');
            if (!socket.connected) {
                const { io } = require('socket.io-client');
                const { SOCKET_URL } = require('./utils/config');
                const tempSocket = io(SOCKET_URL, { transports: ['websocket'] });
                tempSocket.on('connect', () => {
                    tempSocket.emit('call-declined', { roomId: data.roomId });
                    setTimeout(() => tempSocket.disconnect(), 1000);
                });
            } else {
                socket.emit('call-declined', { roomId: data.roomId });
            }
        } catch (e) {}
        await notifee.cancelNotification(detail.notification.id);
    }
});
}