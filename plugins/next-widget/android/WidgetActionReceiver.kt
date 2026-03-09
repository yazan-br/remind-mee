package com.anonymous.remindme

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import org.json.JSONArray
import org.json.JSONObject

class WidgetActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == ACTION_DONE) {
            val taskId = intent.getStringExtra(EXTRA_TASK_ID) ?: return
            val prefs = context.getSharedPreferences(WidgetBridgeModule.PREFS_NAME, 0)
            val tasksJson = prefs.getString(WidgetBridgeModule.KEY_TASKS, "[]") ?: "[]"
            try {
                val tasks = JSONArray(tasksJson)
                for (i in 0 until tasks.length()) {
                    val t = tasks.getJSONObject(i)
                    if (t.optString("id") == taskId) {
                        t.put("status", "completed")
                        t.put("completedAt", System.currentTimeMillis())
                        break
                    }
                }
                prefs.edit().putString(WidgetBridgeModule.KEY_TASKS, tasks.toString()).apply()
                val now = System.currentTimeMillis()
                var nextTask: JSONObject? = null
                for (i in 0 until tasks.length()) {
                    val t = tasks.getJSONObject(i)
                    if (t.optString("status") == "completed") continue
                    val snoozed = t.optLong("snoozedUntil", 0)
                    if (snoozed > 0 && snoozed > now) continue
                    nextTask = t
                    break
                }
                prefs.edit()
                    .putString(WidgetBridgeModule.KEY_TASK, nextTask?.optString("instruction") ?: "")
                    .putString(WidgetBridgeModule.KEY_TASK_ID, nextTask?.optString("id") ?: "")
                    .putBoolean(WidgetBridgeModule.KEY_URGENT, nextTask?.optBoolean("urgent") == true || (nextTask?.optLong("createdAt", 0) ?: 0) < now - 24 * 60 * 60 * 1000)
                    .putString(WidgetBridgeModule.KEY_EMOJI, getEmoji(nextTask, now))
                    .putLong(WidgetBridgeModule.KEY_CREATED_AT, nextTask?.optLong("createdAt", 0) ?: 0)
                    .apply()
                NextWidgetProvider.updateWidget(context)
            } catch (_: Exception) {}
        }
    }

    private fun getEmoji(task: JSONObject?, now: Long): String {
        if (task == null) return "\uD83C\uDF31"
        val createdAt = task.optLong("createdAt", now)
        val hours = (now - createdAt) / (1000.0 * 60 * 60)
        return when {
            hours < 2 -> "\uD83C\uDF31"
            hours < 4 -> "\u23F0"
            else -> "\uD83D\uDCA9"
        }
    }

    companion object {
        const val ACTION_DONE = "com.anonymous.remindme.WIDGET_DONE"
        const val EXTRA_TASK_ID = "taskId"
    }
}
