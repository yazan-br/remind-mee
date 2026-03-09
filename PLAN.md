# Next — ADHD Reminder Widget: Product Plan

## 1. Product Overview

**Name:** Next

**Core principle:** Only one question exists — what is the next action?

**Target:** People with ADHD who struggle with time blindness, executive dysfunction, working memory limits, notification blindness, ambiguity paralysis, and hyperfocus.

**Platform:** iOS + Android (mobile-first, widget-centric)

---

## 2. Technical Architecture

### 2.1 Recommended Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Mobile app | React Native (Expo) | Single codebase for iOS + Android, widget support via native modules |
| Alternative | Flutter | Strong widget support, single codebase |
| Backend | Supabase or Firebase | Auth, sync, push notifications |
| Local storage | SQLite / MMKV | Offline-first, instant load |
| Push | FCM (Android) + APNs (iOS) | Layered reminders, lock-screen alerts |

### 2.2 App Structure

```
remind-me/
├── app/                    # Expo Router or React Navigation
│   ├── (tabs)/            # Main screens
│   ├── task/[id]/         # Task detail (minimal)
│   └── _layout.tsx
├── components/
│   ├── widgets/           # Widget UI components
│   ├── TaskInput/         # 1-tap capture
│   └── ReminderCard/      # Persistent card
├── services/
│   ├── reminders.ts       # Escalation logic
│   ├── notifications.ts   # Layered alerts
│   └── tasks.ts           # CRUD, micro-task split
├── native/                # iOS + Android widget code
│   ├── ios/
│   └── android/
└── shared/
    └── types.ts
```

---

## 3. Feature Phases

### Phase 1 — MVP (Critical)

| Feature | Implementation | ADHD rationale |
|---------|----------------|----------------|
| Instant task input | Single tap opens input; no categories, no tags | Frictionless capture |
| Action-based task field | Text hint: "What is the exact next action?" | Reduces ambiguity paralysis |
| Persistent widget | Home-screen widget showing NEXT + instruction | Visual persistence |
| DONE button | One tap removes task, shows next | Clear completion feedback |
| SNOOZE 5m | Short delay, task returns | Avoids dismissal without action |
| Layered reminders | Level 1: soft vibration → Level 2: notification → Level 3: widget highlight | Compensates for notification blindness |
| Lock-screen reminder | Lock-screen widget (iOS 16+) / Android lock widget | Persistent external cue |

### Phase 2 — Core

| Feature | Implementation | ADHD rationale |
|---------|----------------|----------------|
| Countdown widget | "Next task in 08:12" + task name | Externalizes time |
| Focus widget | "Working on: [task]" + DONE | Protects against hyperfocus drift |
| Escalation sequence | Soft → notification → widget → lock-screen | Full layered flow |
| Anti-fatigue reset | Weekly prompt: keep / delete / postpone | Prevents alarm blindness |
| Time anchors | "After work", "30 min from now" presets | Context over abstract time |

### Phase 3 — Optional

| Feature | Implementation |
|---------|----------------|
| Voice input | Speech-to-text for task creation |
| Micro-task split | AI or rule-based: "Clean kitchen" → sub-steps |
| Smartwatch | Wear OS / watchOS companion |
| Focus timer | Pomodoro-style with Next integration |

---

## 4. Widget Specifications

### 4.1 Widget A — Next Task (Primary)

```
┌─────────────────────────────────┐
│ NEXT                            │
│                                 │
│ Take medication                 │
│                                 │
│ [ DONE ]        [ 5m ]          │
└─────────────────────────────────┘
```

- Top: "NEXT" label
- Center: Large, clear instruction (action-based)
- Bottom: DONE (primary) + SNOOZE 5m (secondary)
- Tap DONE: task completes, next appears
- Tap 5m: snooze, countdown in widget

### 4.2 Widget B — Countdown Mode

```
┌─────────────────────────────────┐
│ COUNTDOWN                        │
│ Next task in                    │
│ 08:12                           │
│                                 │
│ Prepare meeting notes           │
└─────────────────────────────────┘
```

- Purpose: Externalize time
- Updates every minute (or second for last 60s)
- Shows task name below countdown

### 4.3 Widget C — Focus Task

```
┌─────────────────────────────────┐
│ FOCUS TASK                      │
│ Working on                      │
│                                 │
│ Write first email               │
│                                 │
│ [ DONE ]                        │
└─────────────────────────────────┘
```

- User explicitly sets "focus" task
- Protects against hyperfocus drift (reminder to check in)
- Single DONE action

---

## 5. Reminder Lifecycle & Behavior Logic

### 5.1 Task Flow

```
Create → Appear → [Ignored?] → Escalate
                → [Snoozed?] → Wait 5m → Re-appear
                → [Done?] → Remove → Show next
```

### 5.2 Escalation Sequence

| Level | Trigger | Action |
|-------|---------|--------|
| 1 | Task due | Soft vibration only |
| 2 | +2 min ignored | Push notification |
| 3 | +5 min ignored | Widget highlight (pulse/color) |
| 4 | +10 min ignored | Lock-screen persistent card |

**Rule:** No repeated identical alerts. Each level fires once per task instance.

### 5.3 Anti-Fatigue: Weekly Reset

- **Trigger:** Every 7 days (configurable)
- **Prompt:** "Review reminders"
- **Options:** Keep / Delete / Postpone (1 week)
- **Purpose:** Remove stale reminders, prevent notification blindness

---

## 6. UX Flows

### 6.1 Create Task

1. Tap widget or app icon
2. Input field focused immediately (no extra taps)
3. Type or speak (Phase 3)
4. Optional: set time anchor ("After work", "30 min", "6pm")
5. Done — task enters queue

### 6.2 Complete Task

1. Tap DONE on widget or in app
2. Task disappears
3. Next task appears immediately
4. Optional: brief completion feedback (subtle)

### 6.3 Snooze

1. Tap 5m
2. Task hidden for 5 minutes
3. Widget shows countdown or "Back in 5m"
4. At 5m: task returns, escalation restarts from Level 1

---

## 7. Platform-Specific Requirements

### iOS

- Lock-screen widget (iOS 16+)
- Dynamic Island alert (iOS 16.1+)
- Live Activity for countdown
- WidgetKit for home-screen widgets

### Android

- Home-screen persistent widget
- Lock-screen widget (vendor-dependent)
- Notification channel with high priority
- Adaptive icon badge for pending count

---

## 8. Data Model

```
Task
  id: string
  instruction: string          # Action-based, e.g. "Open laptop → write first paragraph"
  scheduledAt: datetime       # Optional time anchor
  timeAnchor: enum            # "after_work" | "30_min" | "6pm" | "now"
  subTasks: Task[]            # Micro-tasks (Phase 3)
  status: "pending" | "snoozed" | "completed"
  snoozedUntil: datetime
  escalationLevel: 0-4
  createdAt: datetime
  completedAt: datetime
```

---

## 9. Implementation Order

1. **Week 1:** Project setup, data model, local storage, basic task CRUD
2. **Week 2:** Main app UI (minimal: task list, input, DONE, SNOOZE)
3. **Week 3:** Home-screen widget (Widget A) — iOS + Android
4. **Week 4:** Layered reminders (vibration, notification, escalation)
5. **Week 5:** Lock-screen widget
6. **Week 6:** Countdown widget (Widget B), Focus widget (Widget C)
7. **Week 7:** Time anchors, anti-fatigue weekly reset
8. **Week 8:** Polish, testing, edge cases

---

## 10. Success Metrics

- Task creation time < 5 seconds
- Widget visible at all times when task pending
- Escalation reaches Level 4 only when user truly ignores
- Notification fatigue: < 1 weekly reset prompt per user
- Completion rate: track DONE vs SNOOZE vs ignore

---

## 11. Constraints & Decisions

| Decision | Rationale |
|----------|-----------|
| One task at a time in widget | Minimal UI, zero cognitive load |
| 5-minute snooze only | Short enough to re-engage, long enough to avoid spam |
| No categories initially | Frictionless capture |
| Action-based prompts | Reduces ambiguity paralysis |
| Persistent over ephemeral | Working memory compensation |
