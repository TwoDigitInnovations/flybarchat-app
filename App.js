import React, { useEffect, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import Constants, { FONTS } from './src/Assets/Helpers/constant';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { store } from './redux/store';
// import { checkLogin } from './redux/auth/authAction';
import Spinner from './src/Assets/Component/Spinner';
// import NetError from './src/Assets/Component/NetError';
// import Splash from 'react-native-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkLogin } from './redux/auth/authAction';
import { ONESIGNAL_APP_ID, SOCKET_URL } from './utils/config';
import { navigate } from './utils/navigationRef';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
} from '@react-native-firebase/messaging';
import { socket } from './utils';
// import i18n from './i18n';
// import { setLanguage } from './redux/location/locationSlice';

const SIGNALING_SERVER_URL = SOCKET_URL;
const App = () => {
  // const APP_ID = 'df0d1c60-c14f-4226-8ba1-927c55e75f3a';

  // useEffect(() => {
  //   OneSignal.initialize(APP_ID);
  //   OneSignal.Notifications.requestPermission(true);
  // }, [OneSignal]);

  useEffect(()=>{
    // checkLng()
    store.dispatch(checkLogin()).unwrap()
      .finally(() => {
        // setTimeout(() => {
        //   Splash.hide();
        // }, 500);
      });
  },[])

  const checkLng = async () => {
      const x = await AsyncStorage.getItem('LANG');
      if (x != null) {
        i18n.changeLanguage(x);
        let lng = x == x == 'sv' ? 'Swedish':'English';
        store.dispatch(setLanguage(lng))
      }
    };

    useEffect(() => {
    _initPushServices();
    if (Platform.OS === 'android') {
      _requestMediaPermissions();
    }
  }, []);

  const _requestMediaPermissions = async () => {
    try {
      const { PermissionsAndroid } = require('react-native');
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      console.log('[App] Media permissions requested');
    } catch (err) {
      console.log('[App] Media permission error:', err.message);
    }
  };

  const _createCallChannel = async () => {
    try {
      const notifee = require('@notifee/react-native').default;
      const { AndroidImportance } = require('@notifee/react-native');
      await notifee.createChannel({
        id: 'incoming_call_v3',
        name: 'Incoming Calls',
        importance: AndroidImportance.HIGH,
        sound: 'ringtone',
        vibration: true,
        vibrationPattern: [0, 500, 500, 500],
      });
      console.log('[App] Call notification channel created');
    } catch (err) {
      console.log('[App] Notifee channel error:', err.message);
    }
  };

  const _initPushServices = async () => {
    // ── Create Android notification channel with sound ──────────────────────
    if (Platform.OS === 'android') {
      await _createCallChannel();
    }
    OneSignal.Debug.setLogLevel(LogLevel.Warn);
    OneSignal.initialize(ONESIGNAL_APP_ID);
    OneSignal.Notifications.requestPermission(true);

    // Suppress OneSignal banner when app is open — socket handles it
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      const data = event.notification.additionalData;
      if (data?.type === 'incoming_call') {
        event.preventDefault();
      } else {
        event.notification.display();
      }
    });

    // ── 2. Firebase FCM (Android killed-app wakeup) ─────────────────────────
    if (Platform.OS !== 'android') return;

    // Request POST_NOTIFICATIONS permission (Android 13+)
    // In your useEffect or init function:
const messagingInstance = getMessaging();

// Request permission
const authStatus = await requestPermission(messagingInstance);
console.log('[App] FCM permission status:', authStatus);

// Get FCM token
await _refreshAndRegisterFcmToken();

// Refresh token if it changes
onTokenRefresh(messagingInstance, async (token) => {
  console.log('[App] FCM token refreshed');
  const userId = await AsyncStorage.getItem('userId');
  if (userId) await _sendFcmTokenToServer(userId, token);
});

// ── App BACKGROUNDED — user tapped FCM notification ──
onNotificationOpenedApp(messagingInstance, (remoteMessage) => {
  console.log('[App] FCM notification tapped (background):', remoteMessage?.data);
  _handleCallNotification(remoteMessage?.data);
});

// ── App KILLED — user tapped FCM notification ────────
getInitialNotification(messagingInstance).then((remoteMessage) => {
  if (remoteMessage) {
    console.log('[App] FCM initial notification:', remoteMessage?.data);
    setTimeout(() => _handleCallNotification(remoteMessage?.data), 1500);
  }
});

    // ── App KILLED — user tapped NOTIFEE notification ─────────────────────
    try {
      const notifee = require('@notifee/react-native').default;
      notifee.getInitialNotification().then((initial) => {
        if (initial?.notification?.data) {
          console.log('[App] Notifee initial notification:', initial.notification.data);
          setTimeout(() => _handleCallNotification(initial.notification.data), 1500);
        }
      });
    } catch (e) { }

    // ── Opened from CallActivity Answer button ────────────────────────────
    // Check immediately AND keep retrying — don't clear store until navigated
    _checkNativePendingCall();
  };

  // Check if user answered from CallActivity — retry until navigation is ready
  const _checkNativePendingCall = async () => {
    try {
      const { IncomingCall } = require('react-native').NativeModules;
      if (!IncomingCall) return;
      const pending = await IncomingCall.getPendingCall();
      if (pending?.roomId) {
        console.log('[App] Native pending call — navigating immediately:', pending);
        // Navigate immediately without delay
        const tryNavigate = () => {
          // if (navigationRef.current?.isReady()) {
            navigate('VideoCall', {
              roomId: pending.roomId,
              calleeName: pending.callerName || 'Unknown',
              isInitiator: false,
            });
          // } else {
          //   setTimeout(tryNavigate, 100);
          // }
        };
        tryNavigate();
      }
    } catch (err) {
      console.log('[App] No native pending call:', err.message);
    }
  };

  // ── Navigate to VideoCallScreen as callee ──────────────────────────────────
  const _handleCallNotification = (data) => {
    if (!data || data.type !== 'incoming_call') return;
    const { callerName, roomId } = data;
    if (!roomId) return;

    console.log('[App] Navigating to call — room:', roomId);

    const tryNavigate = () => {
      // if (navigationRef.current?.isReady()) {
        navigate('VideoCall', {
          roomId,
          calleeName: callerName || 'Unknown',
          isInitiator: false,
        });
      // } else {
      //   setTimeout(tryNavigate, 300);
      // }
    };
    tryNavigate();
  };

  // ── Register FCM token with signaling server ───────────────────────────────
  // Called on every app open — ensures server always has latest token
  const _refreshAndRegisterFcmToken = async () => {
    try {
    const messagingInstance = getMessaging();
    const token = await getToken(messagingInstance);
    console.log('[App] FCM token:', token);
    const userId = await AsyncStorage.getItem('userId');
    if (userId && token) await _sendFcmTokenToServer(userId, token);
  } catch (err) {
    console.log('[App] FCM token error:', err.message);
  }
  };

  const _sendFcmTokenToServer = async (userId, fcmToken) => {
    try {
      console.log('[App] Sending FCM token to server — userId:', userId, 'token:', fcmToken.substring(0, 20) + '...');
      const res = await fetch(`${SIGNALING_SERVER_URL}/register-fcm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fcmToken }),
      });
      const json = await res.json();
      console.log('[App] FCM register server response:', JSON.stringify(json));
    } catch (err) {
      console.log('[App] Server FCM register error:', err.message);
    }
  };

  useEffect(() => {
    // Wait for redux to load user, then register presence
    const unsubscribe = store.subscribe(() => {
        const user = store.getState().auth.user;
        if (user?._id && socket.connected) {
            socket.emit('user-online', { userId: user._id, name: user.name });
        }
    });

    socket.on('connect', () => {
        console.log('[App] Socket connected');
        const user = store.getState().auth.user;
        if (user?._id) {
            socket.emit('user-online', { userId: user._id, name: user.name });
        }
    });

    // ✅ Global incoming call listener — works on ALL screens
    socket.on('incoming-call', ({ callerName, callerId, roomId }) => {
        console.log('[App] Incoming call from:', callerName);
        const user = store.getState().auth.user;
        navigate('VideoCall', {
            roomId,
            calleeId: callerId,
            calleeName: callerName,
            callerName: user?.name,
            isInitiator: false,
        });
    });

    socket.on('call-cancelled', () => {
        console.log('[App] Call cancelled');
    });

    return () => {
        unsubscribe();
        socket.off('incoming-call');
        socket.off('call-cancelled');
    };
}, []);
  return (
    <Provider store={store}>
      <SafeAreaView
        edges={
          Platform.OS === 'ios'
            ? ['left', 'top', 'right']
            : ['bottom', 'left', 'right', 'top']
        }style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Constants.light_black} />
        {/* <NetError /> */}
        <Spinner />
        <Navigation />
        <Toast />
      </SafeAreaView>
     </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.light_black,
  },
});

export default App;
