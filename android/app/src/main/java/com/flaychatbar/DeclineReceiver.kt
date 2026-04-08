package com.flaychatbar

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager

class DeclineReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        android.util.Log.d("FlayChatBarFCM", "DeclineReceiver fired — stopping everything")

        // 1. Stop RingtoneService — this stops BOTH ringtone AND vibration
        RingtoneService.stop(context)

        // 2. Reset audio mode so it doesn't stay in RINGTONE mode
        try {
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audioManager.mode = AudioManager.MODE_NORMAL
        } catch (e: Exception) { e.printStackTrace() }

        // 3. Cancel ALL notifications
        try {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.cancelAll()
        } catch (e: Exception) { e.printStackTrace() }

        // 4. Clear pending call data
        PendingCallStore.clear()

        // 5. Close CallActivity if it's open
        CallActivity.instance?.finish()
        CallActivity.instance = null

        android.util.Log.d("FlayChatBarFCM", "DeclineReceiver done")
    }
}