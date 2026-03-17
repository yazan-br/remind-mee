package com.anonymous.remindme

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class NextWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateWidget(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val ids = appWidgetManager.getAppWidgetIds(
                ComponentName(context, NextWidgetProvider::class.java)
            )
            for (id in ids) {
                updateAppWidget(context, appWidgetManager, id)
            }
        }

        private fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs = context.getSharedPreferences(WidgetBridgeModule.PREFS_NAME, 0)
            val task = prefs.getString(WidgetBridgeModule.KEY_TASK, null) ?: ""
            val phrase = prefs.getString(WidgetBridgeModule.KEY_PHRASE, null) ?: ""
            val isUrgent = prefs.getBoolean(WidgetBridgeModule.KEY_URGENT, false)
            val emoji = prefs.getString(WidgetBridgeModule.KEY_EMOJI, "") ?: ""
            val taskId = prefs.getString(WidgetBridgeModule.KEY_TASK_ID, "") ?: ""
            val displayText = when {
                task.isNotEmpty() -> task
                phrase.isNotEmpty() -> phrase
                else -> "What is the next action?"
            }

            val views = RemoteViews(context.packageName, R.layout.widget_layout)
            views.setTextViewText(R.id.widget_label, "NEXT")
            views.setTextViewText(R.id.widget_emoji, emoji)
            views.setTextViewText(R.id.widget_task, displayText)
            views.setViewVisibility(R.id.widget_urgent, if (isUrgent) android.view.View.VISIBLE else android.view.View.GONE)

            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val pendingLaunch = PendingIntent.getActivity(
                context, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingLaunch)

            val doneIntent = Intent(context, WidgetActionReceiver::class.java).apply {
                action = WidgetActionReceiver.ACTION_DONE
                putExtra(WidgetActionReceiver.EXTRA_TASK_ID, taskId)
            }
            val pendingDone = PendingIntent.getBroadcast(
                context, 0, doneIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_done, pendingDone)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
