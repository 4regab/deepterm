"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check } from "lucide-react";
import { usePomodoroStore } from "@/lib/stores";
import type { Task } from "@/lib/schemas/pomodoro";
import useSound from "use-sound";
import {
  NOTIFICATION_SOUND,
  STORAGE_KEYS,
  DEFAULT_NOTIFICATION_VOLUME,
} from "@/lib/sounds";

// Helper to safely access localStorage
function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  if (stored === null) return defaultValue;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
}

// Show browser notification
function showBrowserNotification(title: string, body: string, onClick?: () => void) {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/favicon-32x32.png",
      badge: "/favicon-16x16.png",
      tag: "task-reminder-" + Date.now(),
      requireInteraction: true,
    });
    
    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }
    
    // Auto-close after 30 seconds
    setTimeout(() => notification.close(), 30000);
  }
}

// Check if reminder time has passed (within a 60 second window)
function shouldTriggerReminder(reminderTimeStr: string): boolean {
  const reminderTime = new Date(reminderTimeStr);
  const now = new Date();
  const nowTimestamp = now.getTime();
  const reminderTimestamp = reminderTime.getTime();
  
  return nowTimestamp >= reminderTimestamp && nowTimestamp - reminderTimestamp < 60000;
}


export default function TaskReminderNotification() {
  const pendingTaskReminder = usePomodoroStore((state: { pendingTaskReminder: { taskId: string; taskText: string } | null }) => state.pendingTaskReminder);
  const dismissTaskReminder = usePomodoroStore((state: { dismissTaskReminder: () => void }) => state.dismissTaskReminder);
  
  // Get notification volume from localStorage
  const [notificationVolume] = useState(() =>
    getStoredValue(STORAGE_KEYS.NOTIFICATION_VOLUME, DEFAULT_NOTIFICATION_VOLUME)
  );

  const [playNotification, { stop: stopNotification }] = useSound(NOTIFICATION_SOUND, {
    volume: notificationVolume,
  });

  // Check reminders function
  const checkReminders = useCallback(() => {
    const currentTasks = usePomodoroStore.getState().tasks;
    
    currentTasks.forEach((task: Task) => {
      if (
        task.reminder &&
        task.reminder.enabled &&
        task.reminder.time &&
        !task.reminder.notified &&
        !task.completed
      ) {
        if (shouldTriggerReminder(task.reminder.time)) {
          // Show browser notification
          showBrowserNotification(
            "Task Reminder",
            task.text,
            () => window.focus()
          );
          
          // Set global pending task reminder and play sound
          usePomodoroStore.getState().setPendingTaskReminder({ taskId: task.id, taskText: task.text });
          playNotification();
          
          // Mark as notified
          usePomodoroStore.getState().markTaskNotified(task.id);
        }
      }
    });
  }, [playNotification]);

  // Initialize interval and permission request
  useEffect(() => {
    // Request notification permission once
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    
    // Run initial check
    checkReminders();
    
    // Set up interval to check reminders every 10 seconds
    const intervalId = setInterval(checkReminders, 10000);
    
    return () => clearInterval(intervalId);
  }, [checkReminders]);

  // Stop sound when reminder is dismissed (from any source)
  const prevPendingRef = useRef(pendingTaskReminder);
  useEffect(() => {
    if (prevPendingRef.current && !pendingTaskReminder) {
      stopNotification();
    }
    prevPendingRef.current = pendingTaskReminder;
  }, [pendingTaskReminder, stopNotification]);

  // Dismiss handler
  const handleDismiss = useCallback(() => {
    stopNotification();
    dismissTaskReminder();
  }, [stopNotification, dismissTaskReminder]);

  return (
    <AnimatePresence>
      {pendingTaskReminder && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
        >
          <div className="rounded-2xl shadow-2xl overflow-hidden bg-[#171d2b] text-white">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10">
                  <Bell size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-sora font-semibold text-base mb-1 text-white">
                    Task Reminder
                  </h3>
                  <p className="text-sm text-white/70">
                    {pendingTaskReminder.taskText}
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-lg transition-colors flex-shrink-0 hover:bg-white/10"
                  aria-label="Dismiss"
                >
                  <X size={18} className="text-white/60" />
                </button>
              </div>
            </div>
            <div className="flex border-t border-white/10">
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white"
              >
                <Check size={14} />
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
