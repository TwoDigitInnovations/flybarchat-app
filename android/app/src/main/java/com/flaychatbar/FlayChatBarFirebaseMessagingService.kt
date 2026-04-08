package com.flaychatbar

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class FlayChatBarFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        // When app is KILLED or BACKGROUND:
        //   The JS setBackgroundMessageHandler in index.js handles everything.
        //   Notifee shows the full-screen notification and launches CallActivity.
        //   This method is NOT called for killed apps when notification block is present.
        //
        // When app is FOREGROUND:
        //   The socket 'incoming-call' event in App.js shows IncomingCallScreen.
        //   Nothing to do here — socket already handled it.

        android.util.Log.d("FlayChatBarFCM", "onMessageReceived — data: ${remoteMessage.data}")

        val data = remoteMessage.data

        // Cancel call received — stop ringtone if it somehow started
        if (data["type"] == "cancel_call") {
            android.util.Log.d("FlayChatBarFCM", "cancel_call — stopping RingtoneService")
            RingtoneService.stop(applicationContext)
            return
        }

        if (data["type"] != "incoming_call") return

        // App is open — socket handles this. Just log.
        if (AppLifecycleTracker.isAppInForeground) {
            android.util.Log.d("FlayChatBarFCM", "Foreground — socket handles this call")
            return
        }

        // For killed/background apps, both this Kotlin service AND the JS
        // setBackgroundMessageHandler fire for data-only FCM messages.
        // The JS handler shows the Notifee notification and launches CallActivity.
        // CallActivity.onCreate() starts RingtoneService — do NOT start it here
        // to avoid duplicate ringtones and duplicate foreground service notifications.
        android.util.Log.d("FlayChatBarFCM", "Killed app — JS handler manages notification & ringtone")
    }
}