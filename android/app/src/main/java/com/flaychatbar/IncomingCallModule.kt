package com.flaychatbar

import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class IncomingCallModule(private val reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "IncomingCall"

  @ReactMethod
  fun launchCallScreen(callerName: String, callerId: String, roomId: String) {
    PendingCallStore.callerName = callerName
    PendingCallStore.callerId   = callerId
    PendingCallStore.roomId     = roomId
    val intent = CallActivity.getIntent(reactContext, callerName, callerId, roomId)
    reactContext.startActivity(intent)
  }

  @ReactMethod
  fun answer(callerName: String, callerId: String, roomId: String) {
    // Stop native ringtone before opening MainActivity
    RingtoneService.stop(reactContext)

    val intent = Intent(reactContext, MainActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      putExtra("action",     "answer_call")
      putExtra("callerName", callerName)
      putExtra("callerId",   callerId)
      putExtra("roomId",     roomId)
    }
    reactContext.startActivity(intent)
  }

  @ReactMethod
  fun decline(roomId: String) {
    // Stop native ringtone + vibration
    RingtoneService.stop(reactContext)

    try {
      val audioManager = reactContext.getSystemService(android.content.Context.AUDIO_SERVICE)
          as android.media.AudioManager
      audioManager.mode = android.media.AudioManager.MODE_NORMAL
    } catch (e: Exception) { e.printStackTrace() }

    val activity = reactApplicationContext.currentActivity
    if (activity is CallActivity) {
      activity.runOnUiThread { activity.finish() }
    }
    PendingCallStore.clear()
  }

  // Called from App.js when socket handles a foreground call,
  // to stop any RingtoneService that may have started simultaneously
  // Called from JS background handler when FCM incoming_call arrives.
  // Starts RingtoneService so ringtone plays even if fullScreenAction
  // does not auto-launch CallActivity (e.g. Android 14+ permission restrictions).
  @ReactMethod
  fun startRingtone() {
    RingtoneService.start(reactContext)
  }

  @ReactMethod
  fun stopRingtone() {
    RingtoneService.stop(reactContext)
    try {
      val audioManager = reactContext.getSystemService(android.content.Context.AUDIO_SERVICE)
          as android.media.AudioManager
      audioManager.mode = android.media.AudioManager.MODE_NORMAL
    } catch (e: Exception) { e.printStackTrace() }
  }

  @ReactMethod
  fun getPendingCall(promise: Promise) {
    if (PendingCallStore.hasPendingCall()) {
      val map = Arguments.createMap().apply {
        putString("callerName", PendingCallStore.callerName)
        putString("callerId",   PendingCallStore.callerId)
        putString("roomId",     PendingCallStore.roomId)
      }
      PendingCallStore.clear()
      promise.resolve(map)
    } else {
      promise.resolve(null)
    }
  }
}