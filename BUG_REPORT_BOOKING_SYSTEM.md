# 🔴 CRITICAL BUG REPORT: 24.7 Barbearia Booking System

**Date:** April 2, 2026  
**Status:** 5 Bugs Identified (2 Critical, 3 Medium)  
**Issue:** Slots available when they shouldn't be; system allows overbooking under concurrent conditions

---

## EXECUTIVE SUMMARY

The booking system has **5 bugs preventing correct slot conflict detection**:

1. **🔴 CRITICAL:** Race condition check only validates exact timeSlot match, not duration overlaps
2. **🔴 CRITICAL:** No unique database index to prevent duplicate bookings
3. **🟡 MEDIUM:** getReservationsByBarber returns cancelled reservations (API design issue)
4. **🟡 MEDIUM:** Date input validation missing (could parse wrong dates)
5. **🟡 MEDIUM:** Error handling inconsistent (throws instead of responding with 409)

---

## DETAILED BUG ANALYSIS

### 🔴 BUG #1: Final Race Condition Check - INSUFFICIENT OVERLAP DETECTION

**Location:** [backend/src/controllers/reservationController.js:419-432](backend/src/controllers/reservationController.js#L419)

**Severity:** CRITICAL - This is why April 10 shows available slots even when bookings should overlap

**The Problem:**

The final race condition check (lines 419-432) only checks for **exact timeSlot matches**, but doesn't account for **service duration overlaps**:

```javascript
// ❌ CURRENT (WRONG) - Line 419-432
const finalConflict = await Reservation.countDocuments({
  barberId: barberIdObj,
  reservationDate: { $gte: startOfDay, $lte: endOfDay },
  timeSlot: timeSlot,              // ← Only exact match!
  status: { $ne: "cancelled" },
});

if (finalConflict > 0) {
  throw new Error("Esta hora foi reservada neste meio-tempo. Escolha outro horário.");
}
```

**Why This Fails - Concrete Example:**

```
Scenario: Two concurrent booking requests
- Service A: 60 minutes, booked at 10:00 → ends at 11:00
- Service B: 60 minutes, trying to book at 10:30 → would end at 11:30

Timeline:
T1: Request A checks existing reservations → finds none
T2: Request B checks existing reservations → finds none  
T3: Request A reaches finalConflict check
    - Query: "Is there a reservation with timeSlot='10:00'?" 
    - Answer: No (none exist yet)
    - ALLOWS REQUEST A TO PROCEED ✅

T4: Request B reaches finalConflict check
    - Query: "Is there a reservation with timeSlot='10:30'?" 
    - Answer: No (we're checking for exact "10:30", not "10:00")
    - ALLOWS REQUEST B TO PROCEED ✅ ← SHOULD FAIL!

Result: BOTH bookings saved at 10:00 and 10:30 (overlap!) ❌
```

**Contrast with Earlier Check (Lines 385-398) - This One Is Correct:**

```javascript
// ✅ CORRECT - Line 385-398
const existingReservations = await Reservation.find({
  barberId: barberIdObj,
  status: { $ne: "cancelled" },
  reservationDate: { $gte: startOfDay, $lte: endOfDay },
}).populate("serviceId");

const hasConflict = existingReservations.some((existing) => {
  const existStart = new Date(existing.reservationDate);
  const existEnd = new Date(existStart.getTime() + existing.serviceId.duration * 60000);
  
  // ✅ Proper overlap logic: A.start < B.end && B.start < A.end
  return newStart < existEnd && existStart < newEnd;
});
```

**But This Check Happens BEFORE finalConflict** - If race condition occurs between the two checks, finalConflict doesn't catch it!

**Root Cause:** The finalConflict check was intended as a safety measure but was implemented incorrectly. It should check for **overlap with duration**, not just **exact timeSlot match**.

**Why April 10 Shows Available:** If Service A is at 10:00 and someone tries 10:30, the finalConflict check won't prevent 10:30 because it's looking for exact "10:30" match, which doesn't exist yet.

---

### 🔴 BUG #2: Missing Unique Database Index

**Location:** [backend/src/models/Reservation.js:1-48](backend/src/models/Reservation.js)

**Severity:** CRITICAL - Prevents MongoDB from rejecting duplicate bookings

**The Problem:**

```javascript
// ❌ CURRENT - No unique index defined
const reservationSchema = new mongoose.Schema({
  barberId: { type: ObjectId, ref: "Barber", required: true },
  serviceId: { type: ObjectId, ref: "Service", required: true },
  clientName: { type: String, required: true },
  reservationDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  status: { type: String, enum: [...], default: "confirmed" },
  cancelToken: { unique: true, sparse: true },  // ← Only this has unique
  // ... other fields ...
});

// ❌ MISSING: No compound unique index!
```

**What Should Exist:**

```javascript
// ✅ SHOULD BE:
reservationSchema.index(
  {
    barberId: 1,
    reservationDate: 1,    // Must be date-only (no time component)
    timeSlot: 1,
    status: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      status: { $ne: "cancelled" }  // Only enforce for non-cancelled
    }
  }
);
```

**Impact:**

Without this index, MongoDB will happily create duplicate reservations at the same date/time/barber. The error handler at line 506-514 of reservationController.js **checks for error code 11000** (duplicate key), but that error will never occur because there's no constraint.

**Current Error Handler (Never Gets Triggered):**

```javascript
if (error.code === 11000) {  // ← This condition never happens!
  return res.status(409).json({
    error: "Esta hora já foi reservada neste meio tempo.",
  });
}
```

---

### 🟡 BUG #3: getReservationsByBarber Returns Cancelled Reservations

**Location:** [backend/src/controllers/reservationController.js:644-671](backend/src/controllers/reservationController.js#L644)

**Severity:** MEDIUM (Not causing overbooking, but API design issue)

**The Problem:**

```javascript
// ❌ CURRENT - No status filter when date is provided
exports.getReservationsByBarber = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { date } = req.query;

    let query = { barberId };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.reservationDate = {
        $gte: startDate,
        $lte: endDate,
      };
      // ❌ Missing: query.status = { $ne: "cancelled" }
    }

    const reservations = await Reservation.find(query)
      .populate("serviceId")
      .sort({ reservationDate: 1, timeSlot: 1 });

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**The Issue:**

This endpoint returns **all reservations including cancelled ones** when called with a date parameter. While the frontend [js/main.js:2000](js/main.js#L2000) compensates by filtering `.filter((r) => r.status !== 'cancelled')`, this is poor API design.

**Why It's a Problem:**

1. Frontend shouldn't have to compensate for backend filter mistakes
2. Returns unnecessary data (cancelled bookings)
3. If frontend forgets to filter (or different client uses endpoint), cancelled slots would be marked as booked
4. API behavior is inconsistent (what if date param is not provided? Only returns active?)

**Current Frontend Workaround (Lines 1998-2002):**

```javascript
const bookedIntervals = reservations
  .filter((r) => r.status !== 'cancelled')  // ← Frontend fixes backend bug
  .map((reservation) => {
    // ... compute intervals ...
  });
```

---

### 🟡 BUG #4: Date Input Validation Missing

**Location:** [backend/src/controllers/reservationController.js:650-656](backend/src/controllers/reservationController.js#L650)

**Severity:** MEDIUM (Could return wrong reservations)

**The Problem:**

```javascript
// ❌ CURRENT - No date format validation
if (date) {
  const startDate = new Date(date);  // What format is `date`?
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  query.reservationDate = { $gte: startDate, $lte: endDate };
}
```

**Why It Fails:**

- If `date = "09/04/2026"` (European DD/MM/YYYY), JavaScript's `new Date()` may parse it incorrectly
- If `date = "invalid"`, creates Invalid Date object, queries return wrong results
- No validation that `date` is ISO format "2026-04-10"

**Example Problem:**

```
Request: GET /reservations/barber/barberId123?date=09/04/2026
JavaScript interprets as: September 4, 2026 (MM/DD/YYYY US format)
But backend should interpret as: April 9, 2026 (DD/MM/YYYY PT format)
Result: Returns reservations for wrong date!
```

---

### 🟡 BUG #5: Error Response Inconsistency

**Location:** [backend/src/controllers/reservationController.js:429-432](backend/src/controllers/reservationController.js#L429)

**Severity:** MEDIUM (Poor error handling pattern)

**The Problem:**

```javascript
// ❌ CURRENT - Throws error instead of returning HTTP response
if (finalConflict > 0) {
  throw new Error(
    "Esta hora foi reservada neste meio-tempo. Escolha outro horário.",
  );
}
```

**Should Be:**

```javascript
// ✅ CORRECT - Return HTTP 409 directly
if (finalConflict > 0) {
  return res.status(409).json({
    error: "Esta hora foi reservada neste meio-tempo. Escolha outro horário.",
  });
}
```

**The Issue:**

- Throws error instead of returning HTTP response
- Escapes to catch block (line 505+) which treats it as generic error (500)
- Inconsistent with other validations in the function (lines 220-398 all return HTTP responses)
- Should return 409 (Conflict), not 500 (Internal Server Error)

**All Other Validations Do It Right (Examples):**

```javascript
// ✅ Line 220 - Returns 400
if (!barberId || !serviceId || ...) {
  return res.status(400).json({ error: "..." });
}

// ✅ Line 268 - Returns 400
if (!emailRegex.test(clientEmail)) {
  return res.status(400).json({ error: "..." });
}

// ✅ Line 320 - Returns 400
if (!barber || !barber.isActive) {
  return res.status(404).json({ error: "..." });
}

// ❌ Line 429 - DIFFERENT: Throws error!
if (finalConflict > 0) {
  throw new Error("...");  // Wrong pattern
}
```

---

## DATA INTEGRITY CHECK NEEDED

Run these queries to check current state:

```javascript
// Check for duplicate reservations (same barber, date, slot)
db.reservations.aggregate([
  {
    $match: { status: { $ne: "cancelled" } }
  },
  {
    $group: {
      _id: { barberId: "$barberId", reservationDate: "$reservationDate", timeSlot: "$timeSlot" },
      count: { $sum: 1 }
    }
  },
  { $match: { count: { $gt: 1 } } }
])

// Check April 9 reservations
db.reservations.find({
  reservationDate: { 
    $gte: ISODate("2026-04-09T00:00:00Z"),
    $lte: ISODate("2026-04-09T23:59:59Z")
  },
  status: { $ne: "cancelled" }
})

// Check April 10 reservations
db.reservations.find({
  reservationDate: { 
    $gte: ISODate("2026-04-10T00:00:00Z"),
    $lte: ISODate("2026-04-10T23:59:59Z")
  },
  status: { $ne: "cancelled" }
})

// Check April 17 reservations  
db.reservations.find({
  reservationDate: { 
    $gte: ISODate("2026-04-17T00:00:00Z"),
    $lte: ISODate("2026-04-17T23:59:59Z")
  },
  status: { $ne: "cancelled" }
})

// Count cancelled vs active
db.reservations.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

---

## SUMMARY TABLE

| # | Bug | File | Lines | Severity | Impact | Fix |
|---|-----|------|-------|----------|--------|-----|
| 1 | Race condition check - wrong overlap logic | reservationController.js | 419-432 | 🔴 CRITICAL | Allows overbooking under race conditions | Use duration-based overlap check, not exact match |
| 2 | Missing unique index | Reservation.js | - | 🔴 CRITICAL | Race condition bulletproof - duplicates allowed | Add compound unique index (barberId, date, slot, status) |
| 3 | getReservationsByBarber missing status filter | reservationController.js | 644-671 | 🟡 MEDIUM | Returns cancelled bookings; API confusion | Add status filter to query |
| 4 | Date input format not validated | reservationController.js | 650-656 | 🟡 MEDIUM | May query wrong dates (EU vs US format) | Validate date is ISO format |
| 5 | Error response inconsistent | reservationController.js | 429-432 | 🟡 MEDIUM | Returns 500 instead of 409 | Return HTTP 409 directly instead of throw |

---

## WHY APRIL 10 SHOWS AVAILABLE

**Scenario:** Service booked at 10:00-11:00, someone tries to book 10:30-11:30

1. **Check 1 (Lines 385-398):** ✅ Detects overlap correctly
2. **Between checks:** 🎯 Race condition window opens
3. **Check 2 (Lines 419-432):** ❌ Only checks for exact "10:30" reservation
   - Finds nothing (existing is at "10:00")
   - **Incorrectly allows 10:30 booking**
4. **Database:** No unique index to reject duplicate/overlap
5. **Result:** Both bookings saved

The finalConflict check was supposed to catch race conditions but doesn't account for duration overlaps.

---

## NEXT STEPS

1. **Verify:** Run database queries above to confirm duplicates exist
2. **Identify:** Get exact barberId and serviceId for April 9/10/17
3. **Root cause analysis:** Check if race conditions created any duplicates
4. **Clean data:** Remove duplicate reservations (if any)
5. **Implement fixes:** Start with Bug #1 and #2 (critical)
