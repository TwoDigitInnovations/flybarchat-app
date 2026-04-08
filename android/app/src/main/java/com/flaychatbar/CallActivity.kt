package com.flaychatbar

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/**
 * CallActivity — pure native full-screen incoming call UI
 *
 * No React Native needed. Shows over lock screen instantly.
 * Launched by Notifee fullScreenAction when call arrives.
 *
 * Answer → stores call data → opens MainActivity → App.js navigates to call
 * Decline → cancels notification + finishes
 */
class CallActivity : AppCompatActivity() {

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private val handler = Handler(Looper.getMainLooper())

    companion object {
        var instance: CallActivity? = null

        fun getIntent(context: Context, callerName: String, callerId: String, roomId: String): Intent {
            return Intent(context, CallActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                putExtra("callerName", callerName)
                putExtra("callerId",   callerId)
                putExtra("roomId",     roomId)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Show over lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            (getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager)
                ?.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED  or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON    or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON    or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        super.onCreate(savedInstanceState)
        instance = this

        val callerName = intent.getStringExtra("callerName") ?: "Unknown"
        val callerId   = intent.getStringExtra("callerId")   ?: ""
        val roomId     = intent.getStringExtra("roomId")     ?: ""

        // Store for MainActivity to pick up
        PendingCallStore.callerName = callerName
        PendingCallStore.callerId   = callerId
        PendingCallStore.roomId     = roomId

        buildUI(callerName)
        // Start ringtone here — single source of truth regardless of launch path
        // (fullScreenAction from Notifee OR launchCallScreen from JS both reach onCreate)
        RingtoneService.start(applicationContext)
    }

    private fun buildUI(callerName: String) {
        // Root — dark background
        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#0D1117"))
        }

        // Center content
        val center = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity     = Gravity.CENTER_HORIZONTAL
        }
        val centerParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply { gravity = Gravity.CENTER_VERTICAL; setMargins(0, 0, 0, 200) }

        // Avatar circle
        val avatar = TextView(this).apply {
            text      = callerName.firstOrNull()?.uppercaseChar()?.toString() ?: "?"
            textSize  = 48f
            setTextColor(Color.WHITE)
            gravity   = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#2196F3"))
        }
        val avatarSize = dpToPx(100)
        val avatarParams = LinearLayout.LayoutParams(avatarSize, avatarSize).apply {
            setMargins(0, 0, 0, dpToPx(24))
        }
        avatar.layoutParams = avatarParams

        // Caller name
        val nameView = TextView(this).apply {
            text     = callerName
            textSize = 28f
            setTextColor(Color.WHITE)
            gravity  = Gravity.CENTER
        }
        val nameParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(0, 0, 0, dpToPx(8)) }
        nameView.layoutParams = nameParams

        // Subtitle
        val subtitle = TextView(this).apply {
            text     = "Incoming video call"
            textSize = 16f
            setTextColor(Color.parseColor("#8B949E"))
            gravity  = Gravity.CENTER
        }

        center.addView(avatar)
        center.addView(nameView)
        center.addView(subtitle)

        // Buttons row
        val buttons = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity     = Gravity.CENTER
        }
        val buttonsParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply { gravity = Gravity.BOTTOM; setMargins(0, 0, 0, dpToPx(60)) }
        buttons.layoutParams = buttonsParams

        // Decline button
        val decline = buildCircleButton("✕", Color.parseColor("#F44336"))
        decline.setOnClickListener { onDecline() }
        val declineParams = LinearLayout.LayoutParams(dpToPx(72), dpToPx(72)).apply {
            setMargins(dpToPx(40), 0, dpToPx(40), 0)
        }
        decline.layoutParams = declineParams

        // Decline label
        val declineLabel = buildButtonLabel("Decline")

        // Answer button
        val answer = buildCircleButton("✓", Color.parseColor("#4CAF50"))
        answer.setOnClickListener { onAnswer() }
        val answerParams = LinearLayout.LayoutParams(dpToPx(72), dpToPx(72)).apply {
            setMargins(dpToPx(40), 0, dpToPx(40), 0)
        }
        answer.layoutParams = answerParams

        // Answer label
        val answerLabel = buildButtonLabel("Answer")

        // Wrap each button + label
        val declineWrap = buildButtonWrap(decline, declineLabel)
        val answerWrap  = buildButtonWrap(answer,  answerLabel)

        buttons.addView(declineWrap)
        buttons.addView(answerWrap)

        root.addView(center, centerParams)
        root.addView(buttons)

        setContentView(root)
    }

    private fun buildCircleButton(symbol: String, color: Int): TextView {
        return TextView(this).apply {
            text      = symbol
            textSize  = 28f
            setTextColor(Color.WHITE)
            gravity   = Gravity.CENTER
            setBackgroundColor(color)
        }
    }

    private fun buildButtonLabel(label: String): TextView {
        return TextView(this).apply {
            text     = label
            textSize = 13f
            setTextColor(Color.parseColor("#8B949E"))
            gravity  = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, dpToPx(8), 0, 0) }
        }
    }

    private fun buildButtonWrap(button: View, label: TextView): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity     = Gravity.CENTER_HORIZONTAL
            addView(button)
            addView(label)
        }
    }

    private fun onAnswer() {
        RingtoneService.stop(this)
        cancelNotification()

        // Dismiss keyguard / unlock screen so VideoCall is visible
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(false)
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as android.app.KeyguardManager
            keyguardManager.requestDismissKeyguard(this, object : android.app.KeyguardManager.KeyguardDismissCallback() {
                override fun onDismissSucceeded() {
                    launchMainActivity()
                }
                override fun onDismissCancelled() {
                    // User cancelled unlock — still launch (will show on locked screen)
                    launchMainActivity()
                }
                override fun onDismissError() {
                    launchMainActivity()
                }
            })
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD)
            launchMainActivity()
        }
    }

    private fun launchMainActivity() {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("action",     "answer_call")
            putExtra("callerName", PendingCallStore.callerName)
            putExtra("callerId",   PendingCallStore.callerId)
            putExtra("roomId",     PendingCallStore.roomId)
        }
        startActivity(intent)
        finish()
    }

    private fun onDecline() {
        RingtoneService.stop(this)
        cancelNotification()
        PendingCallStore.clear()
        finish()
    }

    private fun startRingtone() {
        try {
            val uri = try {
                val resId = resources.getIdentifier("ringtone", "raw", packageName)
                if (resId != 0) android.net.Uri.parse("android.resource://$packageName/$resId")
                else RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            } catch (e: Exception) {
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            }

            val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audioManager.mode = AudioManager.MODE_RINGTONE

            mediaPlayer = MediaPlayer().apply {
                setDataSource(this@CallActivity, uri)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                isLooping = true
                prepare()
                start()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun startVibration() {
        try {
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }

            val pattern = longArrayOf(0, 500, 500, 500, 500, 500)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun stopRingtone() {
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
        try {
            vibrator?.cancel()
            vibrator = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
        try {
            // Reset audio mode so mic/speaker work correctly in call
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audioManager.mode = AudioManager.MODE_NORMAL
            // Also stop any system ringtone that may be playing from notification
            val ringtone = RingtoneManager.getRingtone(this,
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE))
            if (ringtone?.isPlaying == true) ringtone.stop()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun cancelNotification() {
        try {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE)
                as android.app.NotificationManager
            nm.cancelAll()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun dpToPx(dp: Int): Int =
        (dp * resources.displayMetrics.density).toInt()

    override fun onDestroy() {
        super.onDestroy()
        stopRingtone()
    }

    override fun onBackPressed() {
        // Prevent back button from dismissing without declining
        onDecline()
    }
}