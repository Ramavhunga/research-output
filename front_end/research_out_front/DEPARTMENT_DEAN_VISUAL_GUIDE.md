# Department Dean Assignment - Visual Guide

## Page Layout

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  Department Dean Assignment                                               ║
║  Dashboard > Admin > Assign Dean to Department                            ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│ ASSIGN DEAN TO DEPARTMENT                       [🔄 Refresh Faculties] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  STEP 1: SELECT FACULTY AND DEPARTMENT                                   │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                           │
│  Faculty *                             Department *                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ -- Select Faculty --                 │ -- Select Department -- │   │
│  │ Engineering (ENG)                    │ (Disabled until faculty  │   │
│  │ Science (SCI)                        │  is selected)            │   │
│  │ Humanities (HUM)                     │                          │   │
│  │ Health Sciences (HS)                 │                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  STEP 2: SEARCH FOR STAFF MEMBER (When Department Selected)              │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                           │
│  ┌─── SEARCH FOR DEAN (STAFF MEMBER) ───────────────────────────────┐   │
│  │                                                                    │   │
│  │  Staff Number *                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐    │   │
│  │  │ (Enter here)              │ [Search Employee]           │    │   │
│  │  └──────────────────────────────────────────────────────────┘    │   │
│  │                                                                    │   │
│  │  EMPLOYEE FOUND (After Search)                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │ ✓ EMPLOYEE FOUND                                           │  │   │
│  │  │                                                             │  │   │
│  │  │ Staff Number          Title                               │  │   │
│  │  │ 12345                 Prof.                               │  │   │
│  │  │                                                             │  │   │
│  │  │ Name                  Department                          │  │   │
│  │  │ John Smith            Department of Engineering           │  │   │
│  │  │                                                             │  │   │
│  │  │ Faculty               Roles                               │  │   │
│  │  │ Engineering           ADMIN | REVIEWER_LEVEL_1            │  │   │
│  │  │                                                             │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  STEP 3: CONFIRM ASSIGNMENT                                              │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                           │
│  [✓ Assign as Dean]  [✕ Clear]                                          │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ ℹ️ INSTRUCTIONS                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. Select a Faculty from the dropdown                                    │
│ 2. Select a Department within that faculty                               │
│ 3. Enter the Staff Number of the person to assign as Dean                │
│ 4. Click "Search Employee" to verify the staff member details            │
│ 5. Click "Assign as Dean" to confirm the assignment                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## State: Faculty Dropdown Expanded

```
┌──────────────────────────────────────────┐
│ -- Select Faculty --                      │ ← Default
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ Engineering (ENG)             ✓ Clickable │
│ Science (SCI)                 ✓ Clickable │
│ Humanities (HUM)              ✓ Clickable │
│ Health Sciences (HS)          ✓ Clickable │
│ Teacher Education (TE)        ✓ Clickable │
│ Law (LAW)                     ✓ Clickable │
└──────────────────────────────────────────┘
```

---

## State: After Faculty Selection

```
Faculty: SELECTED              Department: LOADING...
┌─────────────────────────\     ┌──────────────────────────────┐
│ Engineering (ENG) ✓    │     │ -- Select Department --      │
└─────────────────────────/     │ ⏳ Loading departments...     │
                                 └──────────────────────────────┘
```

---

## State: Department Dropdown Populated

```
┌──────────────────────────────────────────────────┐
│ -- Select Department --                          │ ← Default
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ Department of Computer Science (CS)   ✓ Clickable │
│ Department of Physics (PH)            ✓ Clickable │
│ Department of Mathematics (MA)        ✓ Clickable │
│ Department of Chemistry (CH)          ✓ Clickable │
└──────────────────────────────────────────────────┘
```

---

## State: Staff Search Section - Before Search

```
┌─── SEARCH FOR DEAN (STAFF MEMBER) ──────────────────────────────┐
│                                                                   │
│  Staff Number *                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [            ]              [>  Search Employee]         │  │
│  │ Input here...                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ℹ️ Click "Search Employee" to find the staff member.            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## State: Staff Search - During Search

```
┌───────────────────────────────────────────────────────────┐
│  Staff Number *                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 12345                    ⏳ [Searching...]         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

---

## State: Staff Found Successfully

```
┌────────────────────────────────────────────────────────────────────────┐
│ EMPLOYEE FOUND                                                          │
│ ✓                                                                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Staff Number                  Title                                   │
│  12345                         Prof.                                   │
│                                                                         │
│  Name                          Department                             │
│  John Smith                    Department of Computer Science         │
│                                                                         │
│  Faculty                       Roles                                  │
│  Engineering                   [ADMIN] [REVIEWER_LEVEL_1]             │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## State: Error - Staff Not Found

```
Alert Box (Red Background):
┌────────────────────────────────────────────────────┐
│ ✕ Not found                                        │
│                                                    │
│ No employee details found for staff number 99999.  │
│                                   [OK]             │
└────────────────────────────────────────────────────┘
```

---

## State: Confirmation Dialog

```
Alert Box (Modal):
┌──────────────────────────────────────────────────────────┐
│                                                           │
│ Assign Dean?                                             │
│                                                           │
│ Assign John Smith as Dean of Department of              │
│ Computer Science?                                        │
│                                                           │
│                [Yes, assign]    [Cancel]                 │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## State: Success Confirmation

```
Alert Box (Green Background):
┌────────────────────────────────────────────────────────────────────┐
│ ✓ Success                                                           │
│                                                                     │
│ John Smith has been assigned as Dean of Department of              │
│ Computer Science.                                                  │
│                                              [OK]                   │
└────────────────────────────────────────────────────────────────────┘

After OK:
- Form resets
- All fields cleared
- Return to initial state
```

---

## Form Validation States

### Valid State
```
✓ Faculty Selected
✓ Department Selected  
✓ Staff Found

Button State: ENABLED (Blue, Clickable)
[✓ Assign as Dean]  [✕ Clear]
```

### Invalid State - Missing Faculty
```
✗ Faculty NOT Selected
  Department Disabled
  Staff Search Hidden

Button State: DISABLED (Gray, Not Clickable)
[✓ Assign as Dean]  [✕ Clear]
```

### Invalid State - Missing Department
```
✓ Faculty Selected
✗ Department NOT Selected
  Staff Search Hidden

Button State: DISABLED (Gray, Not Clickable)
[✓ Assign as Dean]  [✕ Clear]
```

### Invalid State - Staff Not Found
```
✓ Faculty Selected
✓ Department Selected
✗ Staff NOT Found

Button State: DISABLED (Gray, Not Clickable)
[✓ Assign as Dean]  [✕ Clear]
```

---

## Color Scheme

```
┌─────────────────────────────────────────────────────────┐
│ Color       │ Usage                │ Hex Value          │
├─────────────────────────────────────────────────────────┤
│ Primary     │ Primary buttons      │ #007bff (Blue)     │
│ Success     │ Assignment button    │ #28a745 (Green)    │
│ Danger      │ Alerts, Errors       │ #dc3545 (Red)      │
│ Info        │ Search, Loading      │ #17a2b8 (Cyan)     │
│ Warning     │ Cautions             │ #ffc107 (Yellow)   │
│ Secondary   │ Secondary buttons    │ #6c757d (Gray)     │
│ Light       │ Backgrounds          │ #f8f9fa (White)    │
│ Dark        │ Text                 │ #212529 (Black)    │
└─────────────────────────────────────────────────────────┘
```

---

## Button States and Behaviors

### Assign as Dean Button
```
ENABLED STATE (Green)
┌──────────────────────┐
│ ✓ Assign as Dean     │ ← Clickable, shows cursor
└──────────────────────┘

DISABLED STATE (Gray)
┌──────────────────────┐
│ ✓ Assign as Dean     │ ← Faded, no cursor, no action
└──────────────────────┘

LOADING STATE (Green with spinner)
┌──────────────────────┐
│ ⏳ Assigning...      │ ← Disabled during submission
└──────────────────────┘

SUCCESS STATE (Reset to initial)
Form clears, returns to enabled state
```

---

## Responsive Design

### Desktop View (1200px+)
```
┌─────────────────────────────────────────────────────┐
│  Faculty (50%)          Department (50%)            │
├─────────────────────┬──────────────────────────────┤
│ [Faculty Dropdown]  │ [Department Dropdown]        │
└─────────────────────┴──────────────────────────────┘
```

### Tablet View (768px - 1199px)
```
┌──────────────────────────────────────────┐
│  Faculty (100%)                          │
├──────────────────────────────────────────┤
│ [Faculty Dropdown]                       │
├──────────────────────────────────────────┤
│  Department (100%)                       │
├──────────────────────────────────────────┤
│ [Department Dropdown]                    │
└──────────────────────────────────────────┘
```

### Mobile View (< 768px)
```
┌──────────────┐
│ Faculty (%)  │
├──────────────┤
│ [Dropdown]   │
├──────────────┤
│ Department   │
├──────────────┤
│ [Dropdown]   │
├──────────────┤
│ Staff Number │
├──────────────┤
│ [Input]      │
├──────────────┤
│ [Button - 100%]
├──────────────┤
│ [Button - 100%]
└──────────────┘
```

---

## Form Field Specifications

### Faculty Dropdown
```
Type:        HTML <select>
Required:    Yes (*)
Disabled by: loadingFaculties
Options:     Dynamic from API
Placeholder: -- Select Faculty --
```

### Department Dropdown
```
Type:        HTML <select>
Required:    Yes (*)
Enabled by:  Faculty selection
Disabled by: loadingDepartments, no departments
Options:     Dynamic based on faculty
Placeholder: -- Select Department --
```

### Staff Number Input
```
Type:        HTML <input type="text">
Required:    Yes (*)
Enabled by:  Department selection
Placeholder: Enter staff number (e.g., 12345)
Disabled by: searching flag
Max Length:  Not specified (adjust as needed)
```

### Search Button
```
Type:        HTML <button>
Label:       "Search Employee"
Color:       Primary (Blue)
Disabled by: searching, empty staff number
Loading:    Shows spinner when searching
```

### Assign Button
```
Type:        HTML <button>
Label:       "Assign as Dean"
Color:       Success (Green)
Disabled by: !isFormValid() || saving
Loading:    Shows spinner when saving
```

### Clear Button
```
Type:        HTML <button>
Label:       "Clear"
Color:       Secondary (Gray - Outline)
Disabled by: saving
Action:     Resets entire form
```

---

## Keyboard Navigation

```
TAB Order:
1. Faculty Dropdown
2. Department Dropdown
3. Staff Number Input
4. Search Button
5. Assign Button
6. Clear Button

ENTER Key:
- Staff Number Input + ENTER → Triggers search
- Button + ENTER → Triggers click

ESCAPE Key:
- Closes any open dialog/modal
```

---

## Accessibility Features

- ✓ Semantic HTML structure
- ✓ ARIA labels on form inputs
- ✓ Color-based indicators supported with icons
- ✓ Error messages announce via screen readers
- ✓ Keyboard navigation fully supported
- ✓ Font sizing readable
- ✓ Contrast ratios meet WCAG standards
- ✓ Focus indicators clearly visible

---

## Loading States Visual

```
Initial Load (Faculties):
┌─────────────────────────────────┐
│ Faculty *                       │
│ ┌────────────────────────────┐  │
│ │ Loading faculties...   ⏳   │  │
│ └────────────────────────────┘  │
└─────────────────────────────────┘

Subsequent Load (Departments):
┌─────────────────────────────────┐
│ Department *                    │
│ ┌────────────────────────────┐  │
│ │ Loading departments...  ⏳  │  │
│ └────────────────────────────┘  │
└─────────────────────────────────┘

Staff Search:
Button: [⏳ Searching...]  (Disabled during search)
```

---

**Visual Layout Generated**: June 9, 2026
**Chart Accuracy**: Based on implemented component
**Last Updated**: Current version

