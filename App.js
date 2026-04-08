import React, { useEffect, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import Constants, { FONTS } from './src/Assets/Helpers/constant';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { store } from './redux/store';
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
import IncomingCallScreen from './src/screen/app/IncommingCallScreen';
import InCallManager from 'react-native-incall-manager';
import i18n from './i18n';
import { setLanguage } from './redux/language/languageSlice';

const SIGNALING_SERVER_URL = SOCKET_URL;
const App = () => {
  // const APP_ID = 'df0d1c60-c14f-4226-8ba1-927c55e75f3a';
  
  // useEffect(() => {
    //   OneSignal.initialize(APP_ID);
    //   OneSignal.Notifications.requestPermission(true);
    // }, [OneSignal]);
    const [incomingCall, setIncomingCall] = useState(null);
    const user = store.getState().auth.user;
    const cancelCallNotification = async () => {
      try {
        const notifee = require('@notifee/react-native').default;
        await notifee.cancelAllNotifications();
      } catch(e) {}
    };
  useEffect(()=>{
    checkLng()
    store.dispatch(checkLogin()).unwrap()
      .then(async() => {
            // ✅ User is now in Redux
            const user = store.getState().auth.user;
            console.log('[App] User loaded:', user?._id);
            
            try {
    const pending = await AsyncStorage.getItem('pendingCall');
    if (pending) {
        const callData = JSON.parse(pending);
        await AsyncStorage.removeItem('pendingCall');
        console.log('[App] Pending call:', callData);

        setTimeout(() => {
            if (callData.action === 'answer') {
              InCallManager.stopRingtone();
                setIncomingCall(null);
                console.log('enter===>')
                // ✅ Go directly to VideoCall — skip IncomingCallScreen
                const freshUser = store.getState().auth.user;
                navigate('VideoCall', {
                    roomId: callData.roomId,
                    calleeId: callData.callerId,
                    calleeName: callData.callerName,
                    callerName: freshUser?.name || 'Me',
                    isInitiator: false,
                });
            } else {
                // ✅ Show IncomingCallScreen
                setIncomingCall({
                    callerName: callData.callerName,
                    callerId: callData.callerId,
                    roomId: callData.roomId,
                });
            }
        }, 1000);
    }
} catch (e) {
    console.log('[App] pendingCall error:', e.message);
}


            // Now safe to register FCM
            if (Platform.OS === 'android') {
                _refreshAndRegisterFcmToken();
            }

            // Register socket presence
            if (user?._id && socket.connected) {
                socket.emit('user-online', { userId: user._id, name: user.name });
            }

            // Check for a pending call (user pressed Answer on notification while app
            // was killed).  MUST run here — after checkLogin() calls reset('App') —
            // otherwise reset() wipes the VideoCall screen off the stack.
            if (Platform.OS === 'android') {
                _checkNativePendingCall();
            }
        });
        _initPushServices();
        if (Platform.OS === 'android') {
      _requestMediaPermissions();
    }
  },[])

  const checkLng = async () => {
      try {
      const code = await AsyncStorage.getItem('LANG');

      if (code) {
        i18n.changeLanguage(code);
        store.dispatch(setLanguage(code));
      }
    } catch (e) {
      console.log('Lang load error', e);
    }
    };


  useEffect(() => {
    socket.on('connect', () => {
        const user = store.getState().auth.user;
        console.log('[App] Socket connected, user:', user?._id);
        if (user?._id) {
            socket.emit('user-online', { userId: user._id, name: user.name });
            // Also re-register FCM on reconnect
            _refreshAndRegisterFcmToken();
        }
    });

    socket.on('incoming-call', ({ callerName, callerId, roomId }) => {
    console.log('[App] Incoming call from:', callerName);
    
    // Stop any native RingtoneService that may have started simultaneously
    // (race condition: FCM and socket can both fire when app wakes)
    try {
        const { NativeModules } = require('react-native');
        NativeModules.IncomingCall?.stopRingtone();
    } catch(e) {}

    // Cancel any native notification too
    try {
        const notifee = require('@notifee/react-native').default;
        notifee.cancelAllNotifications();
    } catch(e) {}
    
    // JS layer plays its own ringtone for the IncomingCallScreen overlay
    InCallManager.startRingtone('_BUNDLE_');
    setIncomingCall({ callerName, callerId, roomId });
});



    socket.on('call-cancelled', () => {
        InCallManager.stopRingtone();
        setIncomingCall(null);
        cancelCallNotification()
    });

    return () => {
        socket.off('connect');
        socket.off('incoming-call');
        socket.off('call-cancelled');
    };
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
      // Silent channel — RingtoneService handles all audio/vibration
      await notifee.createChannel({
        id: 'incoming_call_silent',
        name: 'Incoming Calls',
        importance: AndroidImportance.HIGH,
        sound: '',
        vibration: false,
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
    // Suppress ALL OneSignal notifications for incoming calls — always.
    // OneSignal intercepts FCM and would show a blank notification.
    // Socket handles foreground calls, native service handles background/killed.
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
        const data = event.notification.additionalData;
        if (data?.type === 'incoming_call') {
            event.preventDefault();
            return;
        }
        event.notification.display();
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
  // const userId = await AsyncStorage.getItem('userId');
  const userId = user?._id
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

const notifee = require('@notifee/react-native').default;
const { EventType } = require('@notifee/react-native');
    notifee.getInitialNotification().then((initial) => {
    if (!initial) return;
    const data = initial?.notification?.data;
    console.log('[App] Notifee initial:', data, 'pressAction:', initial?.pressAction?.id);

    if (data?.type === 'incoming_call') {
        // If user pressed the Answer action button, IncomingCallModule.answer() already
        // opened MainActivity with extras — _checkNativePendingCall() will navigate
        // directly to VideoCall.  Do NOT show IncomingCallScreen here.
        if (initial?.pressAction?.id === 'answer') return;

        // For body-tap (pressAction.id === 'default') — show IncomingCallScreen.
        // Stop native ringtone first so it doesn't overlap with InCallManager ringtone.
        try {
            const { NativeModules } = require('react-native');
            NativeModules.IncomingCall?.stopRingtone?.();
        } catch (e) {}

        const tryNavigate = (attempts = 0) => {
            const user = store.getState().auth.user;
            if (user?._id) {
                setIncomingCall({
                    callerName: data.callerName,
                    callerId: data.callerId,
                    roomId: data.roomId,
                });
            } else if (attempts < 15) {
                setTimeout(() => tryNavigate(attempts + 1), 300);
            }
        };
        setTimeout(() => tryNavigate(), 1000);
    }
});

// App background — tapped notification
notifee.onForegroundEvent(({ type, detail }) => {
    const data = detail?.notification?.data;
    if (!data || data.type !== 'incoming_call') return;

    if (type === EventType.PRESS) {
        setIncomingCall({
            callerName: data.callerName,
            callerId: data.callerId,
            roomId: data.roomId,
        });
        notifee.cancelNotification(detail.notification.id);
    }

    if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'answer') {
        InCallManager.stopRingtone();
        setIncomingCall(null);
        const user = store.getState().auth.user;
        navigate('VideoCall', {
            roomId: data.roomId,
            calleeId: data.callerId,
            calleeName: data.callerName,
            callerName: user?.name,
            isInitiator: false,
        });
        notifee.cancelNotification(detail.notification.id);
    }

    if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'decline') {
        socket.emit('call-declined', { roomId: data.roomId });
        notifee.cancelNotification(detail.notification.id);
    }
});

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

   const tryNavigate = (attempts = 0) => {
        const freshUser = store.getState().auth.user; // ← fresh every time
        if (freshUser?._id) {
            setIncomingCall({
                callerName: data.callerName,
                callerId: data.callerId,
                roomId: data.roomId,
            });
        } else if (attempts < 15) {
            setTimeout(() => tryNavigate(attempts + 1), 300);
        } else {
            // Give up — show anyway
            setIncomingCall({
                callerName: data.callerName,
                callerId: data.callerId,
                roomId: data.roomId,
            });
        }
    };
    tryNavigate();
  };

  // ── Register FCM token with signaling server ───────────────────────────────
  // Called on every app open — ensures server always has latest token
  const _refreshAndRegisterFcmToken = async () => {
     try {
        const messagingInstance = getMessaging();
        const token = await getToken(messagingInstance);
        
        // ✅ Always get fresh from store, not captured closure
        const user = store.getState().auth.user;
        console.log('[App] FCM register — userId:', user?._id, 'token:', token?.substring(0, 20));
        
        if (user?._id && token) {
            await _sendFcmTokenToServer(user._id, token);
        } else {
            console.log('[App] ⚠️ Cannot register FCM — userId:', user?._id, 'hasToken:', !!token);
        }
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

//   useEffect(() => {
//     // Wait for redux to load user, then register presence
//     const unsubscribe = store.subscribe(() => {
//         const user = store.getState().auth.user;
//         if (user?._id && socket.connected) {
//             socket.emit('user-online', { userId: user._id, name: user.name });
//         }
//     });

//     socket.on('connect', () => {
//         console.log('[App] Socket connected');
//         const user = store.getState().auth.user;
//         if (user?._id) {
//             socket.emit('user-online', { userId: user._id, name: user.name });
//         }
//     });

//     // ✅ Global incoming call listener — works on ALL screens
//     socket.on('incoming-call', ({ callerName, callerId, roomId }) => {
//         console.log('[App] Incoming call from:', callerName);
//         const user = store.getState().auth.user;
//         navigate('VideoCall', {
//             roomId,
//             calleeId: callerId,
//             calleeName: callerName,
//             callerName: user?.name,
//             isInitiator: false,
//         });
//     });

//     socket.on('call-cancelled', () => {
//         console.log('[App] Call cancelled');
//     });

//     return () => {
//         unsubscribe();
//         socket.off('incoming-call');
//         socket.off('call-cancelled');
//     };
// }, []);
  return (
    <Provider store={store}>
      <SafeAreaView
        edges={
          Platform.OS === 'ios'
            ? ['left', 'top', 'right']
            : ['bottom', 'left', 'right', 'top']
        }style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Constants.light_black} />
        {/* <NetError /> */}
        <Spinner />
        <Navigation />
        <Toast />
        {incomingCall && (
                <IncomingCallScreen
                    callerName={incomingCall.callerName}
                    roomId={incomingCall.roomId}
                    onAnswer={() => {
                        InCallManager.stopRingtone();
                        cancelCallNotification();
                        // Stop native ringtone in case it started
                        try {
                            const { NativeModules } = require('react-native');
                            NativeModules.IncomingCall?.stopRingtone();
                        } catch(e) {}
                        const user = store.getState().auth.user;
                        setIncomingCall(null);
                        navigate('VideoCall', {
                            roomId: incomingCall.roomId,
                            calleeId: incomingCall.callerId,
                            calleeName: incomingCall.callerName,
                            callerName: user?.name,
                            isInitiator: false,
                        });
                    }}
                    onDecline={() => {
                        InCallManager.stopRingtone();
                        cancelCallNotification();
                        // Stop native ringtone in case it started
                        try {
                            const { NativeModules } = require('react-native');
                            NativeModules.IncomingCall?.stopRingtone();
                        } catch(e) {}
                        socket.emit('call-declined', { roomId: incomingCall.roomId });
                        setIncomingCall(null);
                    }}
                />
            )}
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