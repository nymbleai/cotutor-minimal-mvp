# 📊 Data Format & System Behavior

Complete explanation of the JSON export format and how the keylogging system works.

---

## 📥 Exported JSON Structure

When you click "Export Data", you get a JSON file with this structure:

```json
{
  "exportDate": "2025-10-01T14:29:25.253Z",
  "statistics": { ... },
  "totalChangesRecorded": 6,
  "changes": [ ... ]
}
```

---

## 🔍 Field-by-Field Explanation

### **Top Level Fields**

| Field                  | Type              | Description                              |
| ---------------------- | ----------------- | ---------------------------------------- |
| `exportDate`           | ISO 8601 DateTime | Timestamp when you clicked "Export Data" |
| `statistics`           | Object            | Aggregate analytics about all changes    |
| `totalChangesRecorded` | Number            | Total number of change events captured   |
| `changes`              | Array             | Detailed log of each individual change   |

---

### **Statistics Object**

Summary of all keystroke activity:

```json
"statistics": {
  "totalChanges": 6,
  "additions": 6,
  "deletions": 0,
  "modifications": 0,
  "isLogging": true,
  "avgCPS": 4.15,
  "maxCPS": 7.45,
  "currentCPS": 1.98,
  "totalCharsChanged": 51
}
```

| Field               | Type    | Description                             | Example |
| ------------------- | ------- | --------------------------------------- | ------- |
| `totalChanges`      | Number  | Total number of detected changes        | `6`     |
| `additions`         | Number  | How many times text was added           | `6`     |
| `deletions`         | Number  | How many times text was deleted         | `0`     |
| `modifications`     | Number  | How many times text was modified        | `0`     |
| `isLogging`         | Boolean | Was logging active when exported?       | `true`  |
| `avgCPS`            | Number  | Average typing speed (chars/sec)        | `4.15`  |
| `maxCPS`            | Number  | Peak typing speed                       | `7.45`  |
| `currentCPS`        | Number  | Most recent typing speed                | `1.98`  |
| `totalCharsChanged` | Number  | Total characters added/deleted/modified | `51`    |

---

### **Changes Array**

Each change event contains:

```json
{
  "timestamp": "2025-10-01T14:28:42.869Z",
  "changeType": "addition",
  "changeLength": 11,
  "changeIndex": 0,
  "cps": 5.47,
  "previousText": "\r ",
  "currentText": "Hello world\r "
}
```

| Field          | Type              | Description                                                     | Example                      |
| -------------- | ----------------- | --------------------------------------------------------------- | ---------------------------- |
| `timestamp`    | ISO 8601 DateTime | When this change was detected                                   | `"2025-10-01T14:28:42.869Z"` |
| `changeType`   | String            | Type of change: `"addition"`, `"deletion"`, or `"modification"` | `"addition"`                 |
| `changeLength` | Number            | How many characters changed                                     | `11`                         |
| `changeIndex`  | Number            | Character index where change occurred                           | `0` (start of document)      |
| `cps`          | Number            | Characters per second at this moment                            | `5.47`                       |
| `previousText` | String            | Full document text BEFORE this change                           | `"\r "` (empty doc)          |
| `currentText`  | String            | Full document text AFTER this change                            | `"Hello world\r "`           |

---

## ⚙️ How the System Works

### **Polling Mechanism**

The system uses **polling**, not event-based detection:

```
┌─────────────────────────────────────────┐
│  Every 1 second (1000ms)                │
│  ↓                                       │
│  Get full document text via Office.js   │
│  ↓                                       │
│  Compare with last known text           │
│  ↓                                       │
│  If different → Record change           │
│  If same → Do nothing (no storage)      │
│  ↓                                       │
│  Update last known text                 │
│  ↓                                       │
│  Wait 1 second                           │
│  ↓                                       │
│  Repeat                                  │
└─────────────────────────────────────────┘
```

### **Key Points:**

#### ✅ **Changes Are Only Stored When Detected**

If you **don't type**, nothing is stored. The system:

1. Polls every 1 second
2. Compares current document text with last known text
3. **If identical** → Skips storage, just continues polling
4. **If different** → Creates a change object and stores it

**Result:** No wasted storage on idle periods.

#### ⏱️ **Polling Rate: 1 Second (1000ms)**

Defined in `keylogger.ts`:

```typescript
private readonly MIN_POLLING_INTERVAL = 1000; // 1 second
```

This means:

- **Maximum detection frequency**: Once per second
- **If you type faster**: Multiple characters in 1 second = ONE change event
- **If you type slower**: One character every 2 seconds = recorded separately

#### 📦 **Storage Limit: Last 50 Changes**

```typescript
private readonly MAX_CHANGES = 50;
```

The system keeps only the **last 50 changes** in memory:

- **Oldest changes are discarded** when limit is reached
- **Export anytime** to save before they're lost
- **Cleared on page refresh** (not persisted)

---

## 📖 Understanding the Data

### **Example Change Breakdown**

Let's analyze this change event:

```json
{
  "timestamp": "2025-10-01T14:28:42.869Z",
  "changeType": "addition",
  "changeLength": 11,
  "changeIndex": 0,
  "cps": 5.47,
  "previousText": "\r ",
  "currentText": "Hello world\r "
}
```

**What happened:**

- **When**: At 14:28:42.869 (2:28 PM local time)
- **What**: User typed "Hello world"
- **Where**: At index 0 (beginning of document)
- **How much**: 11 characters were added
- **How fast**: Typed at 5.47 characters per second
- **Before**: Document was empty (just `\r ` = carriage return + space from Word)
- **After**: Document now contains "Hello world\r "

### **Change Type Definitions**

| Type             | When It Happens                   | Example                        |
| ---------------- | --------------------------------- | ------------------------------ |
| **addition**     | Text length increased             | Typing new content             |
| **deletion**     | Text length decreased             | Backspace, Delete key          |
| **modification** | Text length same, content changed | Replace selection, autocorrect |

### **CPS (Characters Per Second)**

Formula:

```
CPS = characters_changed / time_between_changes
```

**Example:**

- Previous change: 14:28:42.869
- Current change: 14:28:45.381
- Time difference: 2.512 seconds
- Characters changed: 13
- **CPS** = 13 / 2.512 = **5.18 chars/sec**

**Typical CPS ranges:**

- **Slow**: 1-3 CPS (thinking, editing)
- **Normal**: 3-6 CPS (regular typing)
- **Fast**: 6-10 CPS (experienced typist)
- **Very fast**: 10+ CPS (professional typist, copy-paste)

---

## 🔬 Change Index Explained

The `changeIndex` indicates where in the document the change occurred:

```
Document: "Hello world"
Position:  0123456789...

Index 0  = Start of document
Index 5  = After "Hello"
Index 11 = After "Hello world"
```

**Example:**

```json
{
  "changeIndex": 25,
  "previousText": "Hello world! How are you ",
  "currentText": "Hello world! How are you Fine thank you"
}
```

Change happened at index 25 (after "you ").

---

## 🧪 Testing the System

### **Scenario 1: Rapid Typing**

You type: "Hello" quickly (within 1 second)

**Result:**

```json
{
  "changeLength": 5,
  "changeType": "addition",
  "cps": 0, // Can't calculate (same poll cycle)
  "previousText": "",
  "currentText": "Hello"
}
```

All 5 characters captured in **one change event**.

### **Scenario 2: Slow Typing**

You type: "H" ... wait 2 seconds ... "e" ... wait 2 seconds ... "llo"

**Result:** **3 separate change events**:

1. "H" (1 char)
2. "He" (1 char added)
3. "Hello" (3 chars added)

### **Scenario 3: No Typing**

You don't type for 5 minutes.

**Result:**

- System polls 300 times (every 1 second)
- **Zero change events stored**
- No wasted storage

### **Scenario 4: Edit Existing Text**

Document: "Hello world"
You change "world" to "friend"

**Result:**

```json
{
  "changeType": "modification",
  "changeLength": 1,
  "previousText": "Hello world",
  "currentText": "Hello friend"
}
```

---

## 💡 Why Full Document Text?

You might wonder: **Why store the entire document in each change?**

**Reasons:**

1. **Complete Context**: You can reconstruct exact document state at any point
2. **Diff Analysis**: Compare any two changes to see evolution
3. **Debugging**: Understand exactly what happened
4. **Forensics**: Audit trail of all document states

**Trade-off:**

- **Pro**: Complete history, easy analysis
- **Con**: Larger file size (but still small - your 6 changes = 3KB JSON)

---

## 📈 Performance Characteristics

| Metric                | Value                                     |
| --------------------- | ----------------------------------------- |
| **Polling Frequency** | 1 second (1000ms)                         |
| **Detection Latency** | Max 1 second                              |
| **Storage Trigger**   | Only on detected changes                  |
| **Memory Limit**      | Last 50 changes                           |
| **Per-change Size**   | ~100-500 bytes (depends on document size) |
| **Idle Overhead**     | Zero storage                              |

---

## 🎯 Best Practices

### **For Accurate Analysis:**

1. **Export Frequently**: Don't lose data beyond 50 changes
2. **Understand Polling**: Changes within 1 second are grouped
3. **Check CPS**: Identifies typing patterns vs copy-paste
4. **Review Position**: Tracks where user is working in document

### **For Storage Efficiency:**

1. System already optimized: Only stores when changes occur
2. No action needed from you
3. Export clears can be manually triggered

---

## 🔮 Future Enhancements

Potential improvements:

- **Configurable polling rate** (500ms, 2000ms, etc.)
- **Backend persistence** (automatic uploads)
- **Change compression** (store diffs instead of full text)
- **Session tracking** (multiple work sessions)
- **Analytics dashboard** (visualize typing patterns)

---

## 📝 Summary

### **What Gets Stored:**

✅ Only changes (not idle time)
✅ Full document state before/after
✅ Timestamp, position, length, speed

### **When It's Stored:**

✅ Every 1 second IF document changed
❌ NOT stored if no changes

### **Storage Limits:**

✅ Last 50 changes in memory
❌ Cleared on page refresh
✅ Export to save permanently

### **Polling Rate:**

✅ 1 second (1000ms)
✅ Configurable in code

---

**Your data is working perfectly!** 🎉

The system is efficiently tracking your keystrokes with zero wasted storage on idle periods.
