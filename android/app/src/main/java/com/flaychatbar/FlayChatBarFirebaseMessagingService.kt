package com.flaychatbar

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
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

        if (AppLifecycleTracker.isAppInForeground) {
            android.util.Log.d("FlayChatBarFCM", "App in foreground — skipping")
            return
        }

        PendingCallStore.callerName = callerName
        PendingCallStore.callerId   = callerId
        PendingCallStore.roomId     = roomId

        val ctx: Context = applicationContext
        RingtoneService.start(ctx)

        val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
        val isScreenOn = pm.isInteractive

        android.util.Log.d("FlayChatBarFCM", "Screen on: $isScreenOn")

        if (isScreenOn) {
            showBannerNotification(ctx, callerName, callerId, roomId)
        } else {
            showFullScreenNotification(ctx, callerName, callerId, roomId)
        }
    }

    private fun showBannerNotification(
        ctx: Context,
        callerName: String,
        callerId: String,
        roomId: String
    ) {
        val manager   = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "incoming_call_v3"
        ensureChannel(ctx, manager, channelId)

        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

        val answerIntent = Intent(ctx, MainActivity::class.java)
        answerIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        answerIntent.putExtra("action",     "answer_call")
        answerIntent.putExtra("callerName", callerName)
        answerIntent.putExtra("callerId",   callerId)
        answerIntent.putExtra("roomId",     roomId)

        val declineIntent = Intent(ctx, DeclineReceiver::class.java)
        declineIntent.putExtra("roomId", roomId)

        val answerPending  = PendingIntent.getActivity(ctx, 1, answerIntent, flags)
        val declinePending = PendingIntent.getBroadcast(ctx, 2, declineIntent, flags)
        val tapPending     = PendingIntent.getActivity(ctx, 3, answerIntent, flags)

        val notification = NotificationCompat.Builder(ctx, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("\uD83D\uDCDE $callerName is calling")
            .setContentText("Incoming video call")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setTimeoutAfter(60000)
            .setContentIntent(tapPending)
            .addAction(android.R.drawable.ic_menu_call, "Answer",  answerPending)
            .addAction(android.R.drawable.ic_delete,    "Decline", declinePending)
            .build()

        manager.notify(1001, notification)
        android.util.Log.d("FlayChatBarFCM", "Banner notification posted")
    }

    private fun showFullScreenNotification(
        ctx: Context,
        callerName: String,
        callerId: String,
        roomId: String
    ) {
        val manager   = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "incoming_call_v3"
        ensureChannel(ctx, manager, channelId)

        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

        val fullScreenIntent = CallActivity.getIntent(ctx, callerName, callerId, roomId)
        val fullScreenPending = PendingIntent.getActivity(ctx, 0, fullScreenIntent, flags)

        val answerIntent = Intent(ctx, MainActivity::class.java)
        answerIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        answerIntent.putExtra("action",     "answer_call")
        answerIntent.putExtra("callerName", callerName)
        answerIntent.putExtra("callerId",   callerId)
        answerIntent.putExtra("roomId",     roomId)

        val declineIntent = Intent(ctx, DeclineReceiver::class.java)
        declineIntent.putExtra("roomId", roomId)

        val answerPending  = PendingIntent.getActivity(ctx, 1, answerIntent, flags)
        val declinePending = PendingIntent.getBroadcast(ctx, 2, declineIntent, flags)

        val notification = NotificationCompat.Builder(ctx, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("\uD83D\uDCDE $callerName is calling")
            .setContentText("Incoming video call")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setTimeoutAfter(60000)
            .setFullScreenIntent(fullScreenPending, true)
            .setContentIntent(fullScreenPending)
            .addAction(android.R.drawable.ic_menu_call, "Answer",  answerPending)
            .addAction(android.R.drawable.ic_delete,    "Decline", declinePending)
            .build()

        manager.notify(1001, notification)
        android.util.Log.d("FlayChatBarFCM", "Full-screen notification posted")
    }

    private fun ensureChannel(ctx: Context, manager: NotificationManager, channelId: String) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        if (manager.getNotificationChannel(channelId) != null) return

        val soundUri = try {
            val resId = ctx.resources.getIdentifier("ringtone", "raw", ctx.packageName)
            if (resId != 0) android.net.Uri.parse("android.resource://${ctx.packageName}/$resId")
            else RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
        } catch (e: Exception) {
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
        }

        val channel = NotificationChannel(
            channelId,
            "Incoming Calls",
            NotificationManager.IMPORTANCE_HIGH
        )
        channel.enableVibration(false)
        channel.lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
        channel.setSound(null, null)

        manager.createNotificationChannel(channel)
    }
}