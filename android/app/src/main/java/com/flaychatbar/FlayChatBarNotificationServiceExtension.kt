package com.flaychatbar

import android.content.Context
import com.onesignal.notifications.IDisplayableMutableNotification
import com.onesignal.notifications.INotificationReceivedEvent
import com.onesignal.notifications.INotificationServiceExtension

/**
 * OneSignal Service Extension — intercepts ALL OneSignal notifications
 * before they are displayed.
 *
 * For incoming_call type: suppress completely (native FCM service handles it).
 * For everything else: let OneSignal display normally.
 *
 * IMPORTANT: Register this in AndroidManifest.xml inside <application>:
 *
 *   <meta-data
 *       android:name="com.onesignal.NotificationServiceExtension"
 *       android:value="com.flaychatbar.FlayChatBarNotificationServiceExtension" />
 */
class FlayChatBarNotificationServiceExtension : INotificationServiceExtension {

    override fun onNotificationReceived(event: INotificationReceivedEvent) {
        val data = event.notification.additionalData
        val type = data?.optString("type", "") ?: ""

        android.util.Log.d("FlayChatBarFCM", "OneSignal notification received — type: $type")

        if (type == "incoming_call") {
            // Suppress — our native FlayChatBarFirebaseMessagingService handles this
            android.util.Log.d("FlayChatBarFCM", "✅ Suppressing OneSignal incoming_call notification")
            event.preventDefault() // Do not display
        }
        // All other notifications display normally — don't call preventDefault()
    }
}