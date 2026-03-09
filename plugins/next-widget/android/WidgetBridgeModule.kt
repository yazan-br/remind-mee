package com.anonymous.remindme

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Callback

class WidgetBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetBridge"

    @ReactMethod
    fun setTasks(tasksJson: String) {
        reactApplicationContext.getSharedPreferences(PREFS_NAME, 0)
            .edit()
            .putString(KEY_TASKS, tasksJson)
            .apply()
    }

    @ReactMethod
    fun getTasks(callback: Callback) {
        val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, 0)
        val tasks = prefs.getString(KEY_TASKS, "[]")
        callback.invoke(tasks)
    }

    @ReactMethod
    fun updateWidget(task: String?, taskId: String, isUrgent: Boolean, emoji: String, createdAt: Double) {
        val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, 0)
        prefs.edit()
            .putString(KEY_TASK, task ?: "")
            .putString(KEY_TASK_ID, taskId)
            .putBoolean(KEY_URGENT, isUrgent)
            .putString(KEY_EMOJI, emoji)
            .putLong(KEY_CREATED_AT, createdAt.toLong())
            .apply()
        NextWidgetProvider.updateWidget(reactApplicationContext)
    }

    companion object {
        const val PREFS_NAME = "NextWidget"
        const val KEY_TASKS = "tasks"
        const val KEY_TASK = "task"
        const val KEY_TASK_ID = "taskId"
        const val KEY_URGENT = "urgent"
        const val KEY_EMOJI = "emoji"
        const val KEY_CREATED_AT = "createdAt"
    }
}
