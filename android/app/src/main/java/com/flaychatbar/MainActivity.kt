package com.flaychatbar

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "FlayChatBar"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    createCallNotificationChannel()
    handleCallIntent(intent)
  }

  override fun onNewIntent(intent: android.content.Intent?) {
    super.onNewIntent(intent)
    handleCallIntent(intent)
  }

  private fun handleCallIntent(intent: android.content.Intent?) {
    intent?.getStringExtra("action")?.let { action ->
      if (action == "answer_call") {
        PendingCallStore.callerName = intent.getStringExtra("callerName") ?: ""
        PendingCallStore.callerId   = intent.getStringExtra("callerId")   ?: ""
        PendingCallStore.roomId     = intent.getStringExtra("roomId")     ?: ""

        // Stop looping ringtone immediately
        RingtoneService.stop(this)
        try {
          CallActivity.instance?.finish()
          CallActivity.instance = null
        } catch (e: Exception) { e.printStackTrace() }

        // Ensure screen stays on and visible after keyguard dismiss
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
          setShowWhenLocked(true)
          setTurnScreenOn(true)
        } else {
          @Suppress("DEPRECATION")
          window.addFlags(
            android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON   or
            android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
          )
        }
      }
    }
  }

  private fun createCallNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
      ?: return

    val channelId = "incoming_call_v3"
    if (manager.getNotificationChannel(channelId) != null) return

    val channel = NotificationChannel(
      channelId,
      "Incoming Calls",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Incoming video call notifications"
      enableVibration(true)
      vibrationPattern = longArrayOf(0, 500, 500, 500, 500, 500)
      setShowBadge(true)
      lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
    }

    val soundUri: Uri = try {
      val resId = resources.getIdentifier("ringtone", "raw", packageName)
      if (resId != 0) Uri.parse("android.resource://$packageName/$resId")
      else RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
    } catch (e: Exception) {
      RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
    }

    channel.setSound(
      soundUri,
      AudioAttributes.Builder()
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
        .build()
    )

    manager.createNotificationChannel(channel)
  }
}

/** Stores pending call data passed from IncomingCallActivity → MainActivity */
object PendingCallStore {
  var callerName: String = ""
  var callerId:   String = ""
  var roomId:     String = ""

  fun clear() { callerName = ""; callerId = ""; roomId = "" }
  fun hasPendingCall() = roomId.isNotEmpty()
}