package com.flaychatbar

import android.app.Activity
import android.app.Application
import android.os.Bundle

/**
 * Tracks whether the app is currently in the foreground.
 * Register in MainApplication.onCreate().
 * Used by FlayChatBarFirebaseMessagingService to skip CallActivity
 * when the app is already open (socket handler shows UI instead).
 */
object AppLifecycleTracker : Application.ActivityLifecycleCallbacks {

    var isAppInForeground: Boolean = false
        private set

    private var activityCount = 0

    override fun onActivityStarted(activity: Activity) {
        activityCount++
        isAppInForeground = true
    }

    override fun onActivityStopped(activity: Activity) {
        activityCount--
        if (activityCount <= 0) {
            activityCount = 0
            isAppInForeground = false
        }
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
    override fun onActivityResumed(activity: Activity) {}
    override fun onActivityPaused(activity: Activity) {}
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
    override fun onActivityDestroyed(activity: Activity) {}
}