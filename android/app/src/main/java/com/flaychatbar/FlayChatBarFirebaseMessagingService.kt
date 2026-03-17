package com.flaychatbar

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class FlayChatBarFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val data = remoteMessage.data
        if (data["type"] != "incoming_call") return

        val callerName = data["callerName"] ?: "Unknown"
        val callerId   = data["callerId"]   ?: ""
        val roomId     = data["roomId"]     ?: ""

        if (roomId.isEmpty()) return

        android.util.Log.d("FlayChatBarFCM", "Incoming call from $callerName room=$roomId")

        // App is open — socket already shows React Native UI, skip everything
        if (AppLifecycleTracker.isAppInForeground) {
            android.util.Log.d("FlayChatBarFCM", "App in foreground — skipping")
            return
        }

        // Store call data
        PendingCallStore.callerName = callerName
        PendingCallStore.callerId   = callerId
        PendingCallStore.roomId     = roomId

        // Start looping ringtone service — works for both banner and full-screen
        RingtoneService.start(this)

        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        val isScreenOn = pm.isInteractive

        android.util.Log.d("FlayChatBarFCM", "Screen on: $isScreenOn")

        if (isScreenOn) {
            // Screen is on — just show notification banner with Answer/Decline
            // Tapping Answer goes DIRECTLY to VideoCall, no CallActivity
            showBannerNotification(callerName, callerId, roomId)
        } else {
            // Screen is off / locked — show full-screen CallActivity over lock screen
            showFullScreenNotification(callerName, callerId, roomId)
        }
    }

    /**
     * Screen ON — notification banner with direct Answer → VideoCall
     */
    private fun showBannerNotification(callerName: String, callerId: String, roomId: String) {
        val manager   = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "incoming_call_v3"
        ensureChannel(this, manager, channelId)

        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

        // Answer → opens MainActivity directly → App.js navigates to VideoCall immediately
        val answerIntent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("action",     "answer_call")
            putExtra("callerName", callerName)
            putExtra("callerId",   callerId)
            putExtra("roomId",     roomId)
        }
        val answerPending  = PendingIntent.getActivity(this, 1, answerIntent, flags)
        val declinePending = PendingIntent.getBroadcast(
            this, 2,
            Intent(this, DeclineReceiver::class.java).apply { putExtra("roomId", roomId) },
            flags
        )
        // Tapping notification body also answers
        val tapPending = PendingIntent.getActivity(this, 3, answerIntent, flags)

        val notification = NotificationCompat.Builder(this@FlayChatBarFirebaseMessagingService, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("📞 $callerName is calling")
            .setContentText("Incoming video call")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setTimeoutAfter(60000)
            .setContentIntent(tapPending)
            .addAction(android.R.drawable.ic_menu_call, "✅ Answer",  answerPending)
            .addAction(android.R.drawable.ic_delete,    "❌ Decline", declinePending)
            .build()

        manager.notify(1001, notification)
        android.util.Log.d("FlayChatBarFCM", "Banner notification posted")
    }

    /**
     * Screen OFF / locked — full-screen CallActivity over lock screen
     */
    private fun showFullScreenNotification(callerName: String, callerId: String, roomId: String) {
        val manager   = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "incoming_call_v3"
        ensureChannel(this, manager, channelId)

        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

        // Full-screen → CallActivity (native UI over lock screen)
        val fullScreenPendingIntent = PendingIntent.getActivity(
            this, 0, CallActivity.getIntent(this, callerName, callerId, roomId), flags
        )
        // Answer in notification → direct to MainActivity → VideoCall
        val answerIntent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("action",     "answer_call")
            putExtra("callerName", callerName)
            putExtra("callerId",   callerId)
            putExtra("roomId",     roomId)
        }
        val answerPending  = PendingIntent.getActivity(this, 1, answerIntent, flags)
        val declinePending = PendingIntent.getBroadcast(
            this, 2,
            Intent(this, DeclineReceiver::class.java).apply { putExtra("roomId", roomId) },
            flags
        )

        val notification = NotificationCompat.Builder(this@FlayChatBarFirebaseMessagingService, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("📞 $callerName is calling")
            .setContentText("Incoming video call")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setTimeoutAfter(60000)
            .setFullScreenIntent(fullScreenPendingIntent, true)   // ← CallActivity on lock screen
            .setContentIntent(fullScreenPendingIntent)
            .addAction(android.R.drawable.ic_menu_call, "✅ Answer",  answerPending)
            .addAction(android.R.drawable.ic_delete,    "❌ Decline", declinePending)
            .build()

        manager.notify(1001, notification)
        android.util.Log.d("FlayChatBarFCM", "Full-screen notification posted")
    }

    private fun ensureChannel(context: Context, manager: NotificationManager, channelId: String) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    if (manager.getNotificationChannel(channelId) != null) return

    val soundUri = try {
        val resId = context.resources.getIdentifier("ringtone", "raw", context.packageName)
        if (resId != 0) android.net.Uri.parse("android.resource://${context.packageName}/$resId")
        else RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
    } catch (e: Exception) {
        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
    }

    val channel = NotificationChannel(channelId, "Incoming Calls", NotificationManager.IMPORTANCE_HIGH).apply {
        enableVibration(false)
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
        setSound(null, null)
    }
    manager.createNotificationChannel(channel)
}
}