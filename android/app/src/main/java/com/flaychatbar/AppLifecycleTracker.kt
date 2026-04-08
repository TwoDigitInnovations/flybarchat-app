package com.flaychatbar

import android.app.Activity
import android.app.Application
import android.os.Bundle

/**
 * Tracks whether the app has a visible Activity running.
 * activityCount > 0 means a real Activity is started (foreground).
 *
 * IMPORTANT: This is only true when an Activity has called onStart().
 * When the app is killed and FCM wakes the process, no Activity exists yet,
 * so isAppInForeground correctly returns false.
 */
object AppLifecycleTracker : Application.ActivityLifecycleCallbacks {

    var isAppInForeground: Boolean = false
        private set

    // Use a counter not a boolean — handles multiple activities correctly
    private var activityCount = 0

    override fun onActivityStarted(activity: Activity) {
        activityCount++
        isAppInForeground = true
        android.util.Log.d("AppLifecycle", "Activity started: ${activity.localClassName} count=$activityCount")
    }

    override fun onActivityStopped(activity: Activity) {
        activityCount--
        if (activityCount <= 0) {
            activityCount = 0
            isAppInForeground = false
        }
        android.util.Log.d("AppLifecycle", "Activity stopped: ${activity.localClassName} count=$activityCount foreground=$isAppInForeground")
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
    override fun onActivityResumed(activity: Activity) {}
    override fun onActivityPaused(activity: Activity) {}
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
    override fun onActivityDestroyed(activity: Activity) {}
}