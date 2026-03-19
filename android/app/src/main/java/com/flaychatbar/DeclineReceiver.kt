package com.flaychatbar

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.RingtoneManager

class DeclineReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Stop looping ringtone
        RingtoneService.stop(context)

        // Cancel notification
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancelAll()

        // Clear pending call data
        PendingCallStore.clear()

        // Close CallActivity if open
        CallActivity.instance?.finish()
        CallActivity.instance = null

        // Reset audio mode
        try {
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audioManager.mode = AudioManager.MODE_NORMAL
        } catch (e: Exception) { e.printStackTrace() }
    }
}