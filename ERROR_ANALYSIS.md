# Error Analysis: "Erro ao carregar reservas: Cannot read properties of undefined (reading 'role')"

## Error Location

- **File:** [admin/index.html](admin/index.html)
- **Error caught at:** [Line 1730](admin/index.html#L1730)
- **Error message:** `Erro ao carregar reservas: ${error.message}`

## Problem Summary

The error "Cannot read properties of undefined (reading 'role')" indicates that `currentUser` is `undefined` when the code tries to access `currentUser.role` in the `loadReservations()` function.

---

## 1. Root Cause: Race Condition Between Initialization and Function Execution

### Initialization Sequence (Lines 945-964)

```javascript
// Line 950: Initialize from localStorage
let currentUser = JSON.parse(localStorage.getItem("admin_user") || "{}");

// Lines 953-954: Ensure role property exists
if (!currentUser.role) {
  currentUser.role = null;
}
```

**Problem:** If `admin_user` is not in localStorage, `currentUser = {}` (empty object), but the `role` property is explicitly set to `null` only if missing.

### Authentication Check (Lines 3593-3606)

```javascript
// Line 3593-3595: POTENTIAL ISSUE - Sets currentUser = {} without role property
if (!token || !currentUser.role) {
  localStorage.clear();
  token = null;
  currentUser = {}; // ← Sets to empty object, loses role property setup
  showLoginPage();
} else {
  showAdminPanel();
}
```

**Issue:** When clearing authentication, line 3595 sets `currentUser = {}` directly WITHOUT setting `role = null` like the initialization does.

---

## 2. Critical Code Sections Accessing `currentUser.role`

### A. Safety Check in loadReservations (Lines 1521-1527)

```javascript
async function loadReservations(container) {
    try {
        // Verificar se currentUser está autenticado
        if (!currentUser || !currentUser.role) {
            container.innerHTML = '<div class="alert alert-error">Erro: Utilizador não autenticado. Por favor, faça login novamente.</div>';
            return;
        }
```

✅ **Safe** - Properly checks both `!currentUser` AND `!currentUser.role`

---

### B. Unsafe Access Points in loadReservations (Lines 1540-1549)

```javascript
// Line 1541 - DIRECT ACCESS TO currentUser.role
const barbers = currentUser.role === "admin" ? await fetchBarbers() : [];

// Line 1544 - DIRECT ACCESS TO currentUser.role
const defaultBarberId =
  currentUser.role === "admin" ? getDefaultBarberId() : "";

// Line 1545-1549 - DIRECT ACCESS TO currentUser.role
const barberOptions =
  currentUser.role === "admin"
    ? buildBarberOptions(barbers, defaultBarberId)
    : "";

let reservationsUrl;
if (currentUser.role === "barber") {
  // Line 1545 - DIRECT ACCESS
  reservationsUrl = `${API_URL}/barber/reservations`;
} else {
  reservationsUrl = defaultBarberId
    ? `${API_URL}/admin/reservations?barberId=${defaultBarberId}`
    : `${API_URL}/admin/reservations`;
}
```

⚠️ **UNSAFE** - These lines assume `currentUser` is defined. If `currentUser` becomes undefined between the check at line 1522 and these lines, error occurs.

---

### C. Template Literal Access (Line 1573)

```javascript
// Inside buildReservationsHtml function (Line 1564):
const buildReservationsHtml = (items) => {
    const now = new Date();

    // ...

    let html = `
        <div class="reservations-toolbar">
            <span><strong>Total:</strong> ${futureReservations.length}</span>
            ${currentUser.role === 'admin' ? `  // ← Line 1573: DIRECT ACCESS
                <div style="display:flex; gap:0.75rem; flex-wrap: wrap;">
                    <select id="reservationsBarberFilter">${barberOptions}</select>
                    <button id="reservationsApply">Filtrar</button>
                </div>
            ` : ''}
        </div>
    `;
```

⚠️ **UNSAFE** - Directly accesses `currentUser.role` in template literal without null check

---

## 3. Where `currentUser` is Used (Complete List)

| Line          | Context                                              | Access Type                           | Safe?    |
| ------------- | ---------------------------------------------------- | ------------------------------------- | -------- |
| 950           | Initialization from localStorage                     | Read                                  | ✅       |
| 953-954       | Role property setup                                  | Check & Set                           | ✅       |
| 1021-1027     | showAdminPanel() - Menu building                     | `currentUser.role ===`                | ⚠️       |
| 1027          | Menu check: `isAdmin = currentUser.role === 'admin'` | Direct access                         | ⚠️       |
| 1058          | Welcome message: `${currentUser.name}`               | Template literal                      | ⚠️       |
| 1127-1132     | loadPage() function - Page menu setup                | `currentUser.role ===`                | ⚠️       |
| 1246-1247     | getDefaultBarberId() function                        | `currentUser._id` or `currentUser.id` | ⚠️       |
| **1541**      | **loadReservations()**                               | **`currentUser.role === 'admin'`**    | **⚠️⚠️** |
| **1544**      | **loadReservations()**                               | **`currentUser.role === 'admin'`**    | **⚠️⚠️** |
| **1545-1549** | **loadReservations()**                               | **`currentUser.role === 'barber'`**   | **⚠️⚠️** |
| **1573**      | **loadReservations() template**                      | **`currentUser.role === 'admin'`**    | **⚠️⚠️** |
| 3595          | Auth reset                                           | Set to {}                             | ⚠️       |

---

## 4. The Race Condition Scenario

Here's how the error can occur:

1. **Page loads:** `currentUser` is initialized from localStorage (line 950)
   - If user was previously logged in: `currentUser = { _id: "...", name: "...", role: "admin" }`
   - If no stored user: `currentUser = {}` then `role = null` (line 954)

2. **Authentication check (line 3593-3606):**
   - If `token` exists but `currentUser.role` is falsy → enters if block
   - **Bug:** Line 3595 sets `currentUser = {}` WITHOUT re-applying the role property initialization
   - `showLoginPage()` is called

3. **User clicks menu link BEFORE login completes:**
   - The `loadPage()` function is called (line 1114)
   - Check passes at line 1125 (unexpected, but let's trace why)
   - `loadReservations(content)` is called (line 1148)

4. **In loadReservations (line 1521):**
   - Check: `if (!currentUser || !currentUser.role)` may NOT catch the error if:
     - `currentUser` is an object but `currentUser.role` is `undefined` (not `null`)
     - OR there's a timing issue where currentUser becomes undefined between checks

5. **Line 1541:**
   - `const barbers = currentUser.role === 'admin' ? ...`
   - **If `currentUser` is undefined here, error is thrown:** "Cannot read properties of undefined (reading 'role')"

6. **Error caught at line 1730:**
   - `catch (error)` catches the error
   - Displays: `Erro ao carregar reservas: Cannot read properties of undefined (reading 'role')`

---

## 5. Why the Check at Line 1522 May Not Catch This

The check at line 1521-1526:

```javascript
if (!currentUser || !currentUser.role) {
  container.innerHTML =
    '<div class="alert alert-error">Erro: Utilizador não autenticado. Por favor, faça login novamente.</div>';
  return;
}
```

This should catch the error **IF**:

- `currentUser` is `null`, `undefined`, `false`, `0`, `''`, or `NaN`
- **OR** `currentUser.role` is any of the above

**BUT** it may NOT catch if:

- Async operations cause `currentUser` to become undefined AFTER the check but BEFORE lines 1541+
- The role property exists but is `undefined` (though the check should catch this)
- There's a scoping issue where a different `currentUser` is being used in the closure

---

## 6. Additional Issues Found

### Issue A: Inconsistent Authentication Reset

**Lines 3593-3595** vs **Lines 953-954**

When clearing authentication (line 3595), currentUser becomes `{}` without the role property initialization that happens at lines 953-954:

```javascript
// Lines 3595 (INCONSISTENT)
currentUser = {}; // Missing role property setup!

// vs Lines 954 (CONSISTENT)
if (!currentUser.role) {
  currentUser.role = null;
}
```

### Issue B: Async Operations Before loadReservations

Line 1556 in loadReservations:

```javascript
const reservations = await fetchJson(reservationsUrl, {
  headers: { Authorization: `Bearer ${token}` },
});
```

During this async operation, if something (like a hash change event or timer) modifies `currentUser`, the subsequent code at lines 1541-1573 could fail.

---

## Root Causes (Summary)

1. **Inconsistent initialization** - `currentUser = {}` at line 3595 doesn't apply the same role setup as line 954
2. **Missing currentUser validation** - Lines 1541-1573 access `currentUser.role` without re-checking after async operations
3. **Race condition risk** - loadPage can be called between authentication check and function execution
4. **Lack of defensive programming** - Direct property access without null-coalescing or optional chaining

---

## Recommended Fixes

### Fix 1: Consistent Authentication Reset (Lines 3593-3606)

```javascript
if (!token || !currentUser.role) {
  localStorage.clear();
  token = null;
  currentUser = { role: null }; // ← Ensure role property exists
  showLoginPage();
}
```

### Fix 2: Add currentUser Validation Immediately Before Use (Lines 1541)

```javascript
// Add this right after the return check
if (!currentUser?.role) {
  throw new Error(
    "currentUser or currentUser.role is undefined after initial check",
  );
}

// OR use safe navigation
const barbers = currentUser?.role === "admin" ? await fetchBarbers() : [];
```

### Fix 3: Use Optional Chaining Throughout (Lines 1541-1573)

```javascript
// Replace all:
currentUser.role === "admin";
// With:
currentUser?.role === "admin";
```

### Fix 4: Prevent Race Conditions in loadPage (Line 1125)

```javascript
async function loadPage(page) {
    // Check RIGHT BEFORE using currentUser
    if (!currentUser || !currentUser.role || !token) {
        showLoginPage();
        return;
    }

    // Store in local variable to prevent modification during async
    const userSnapshot = { ...currentUser };
```

---

## Files to Examine Further

- **[admin/index.html#L950](admin/index.html#L950)** - currentUser initialization
- **[admin/index.html#L1521](admin/index.html#L1521)** - loadReservations safety check
- **[admin/index.html#L1541](admin/index.html#L1541)** - First unsafe currentUser.role access
- **[admin/index.html#L3593](admin/index.html#L3593)** - Authentication reset (inconsistent)
