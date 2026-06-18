# Student Search - Visual Guide

## User Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ RESEARCHER OPENS JOURNAL DETAIL FORM                            │
│ URL: /journal/create                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: AFFILIATED AUTHORS SECTION                              │
│ (Step 2 in multi-step form)                                     │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Author 1                                                  │  │
│ ├───────────────────────────────────────────────────────────┤  │
│ │ Student/Employee No.  [________________] 🔍 ← SEARCH BTN   │  │
│ │ First Name           [________________]                    │  │
│ │ Surname              [________________]                    │  │
│ │ Email                [________________]                    │  │
│ │ Gender               [________▼]                           │  │
│ │ Faculty              [________▼]                           │  │
│ │ Department           [________▼]                           │  │
│ └───────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
         USER CLICKS SEARCH (🔍)
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ SEARCH MODAL OPENS                                              │
│                                                                  │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ Search Student/Staff Member                          | _ X ║ │
│  ╠═══════════════════════════════════════════════════════════╣ │
│  ║ Enter Student/Staff Number or Name:                      ║ │
│  ║ [________________]   🔍 [SEARCH]                         ║ │
│  ║                                                           ║ │
│  ║ Recent Searches (if any):                                ║ │
│  ║  • John Smith (EMP001) - Computer Science                ║ │
│  ║  • Jane Doe (STU12345) - Biology                         ║ │
│  ╠═══════════════════════════════════════════════════════════╣ │
│  ║                          [Close]  [Search]               ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
└────────────────────┬────────────────────────────────────────────┘
                     │
        USER TYPES STAFF NUMBER & SEARCHES
        Example: "EMP001"
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ SEARCHING... ⏳                                                  │
│                                                                  │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ [Loading spinner]                                         ║ │
│  ║ Searching...                                              ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
└────────────────────┬────────────────────────────────────────────┘
                     │
        BACKEND API CALL
        GET /api/user/student-info/EMP001
                     │
                     ▼
        ┌────────────────────────────────┐
        │  BACKEND (Spring Boot)         │
        │  UserController                │
        │  UserService                   │
        │  ↓                             │
        │  Integration API Call          │
        │  (Azure Microservices)         │
        │  ↓                             │
        │  LoginDTO Response             │
        │  {                             │
        │    staff: {...},               │
        │    student: {...},             │
        │    communication: {...}        │
        │  }                             │
        └────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  FRONTEND (Angular)            │
        │  StudentSearchService          │
        │  Maps LoginDTO →               │
        │  StudentSearchResult           │
        │  {                             │
        │    fullName,                   │
        │    staffNo,                    │
        │    department,                 │
        │    faculty,                    │
        │    ...                         │
        │  }                             │
        └────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ RESULT DISPLAYED IN MODAL ✅                                    │
│                                                                  │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ Muthu Ramavhunga (EMP001)                                ║ │
│  ║ Staff Member                                              ║ │
│  ║ Department: Computer Science                              ║ │
│  ║ Faculty: Science                                           ║ │
│  ║                                    [SELECT] ← GREEN BUTTON  ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
└────────────────────┬────────────────────────────────────────────┘
                     │
        USER CLICKS SELECT
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Modal closes                   │
        │ SessionStorage saves:          │
        │ selectedStudent = {             │
        │   staffNo: 'EMP001',           │
        │   fullName: 'Muthu...',        │
        │   ...                          │
        │ }                              │
        └────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ FORM AUTO-FILLS INSTANTLY ⚡                                    │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Author 1                                                  │  │
│ ├───────────────────────────────────────────────────────────┤  │
│ │ Student/Employee No.  [EMP001] 🔍                         │  │
│ │ First Name           [Muthu] ← AUTO-FILLED ✓              │  │
│ │ Surname              [Ramavhunga] ← AUTO-FILLED ✓         │  │
│ │ Email                [m.r@univen.ac.za] ← AUTO ✓         │  │
│ │ Gender               [MALE] ← AUTO-FILLED ✓              │  │
│ │ Faculty              [Science] ← AUTO-FILLED ✓           │  │
│ │ Department           [Computer Science] ← AUTO ✓         │  │
│ │                                                            │  │
│ │ (Other fields ready for manual entry)                     │  │
│ └───────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
        RESEARCHER CAN NOW:
        • Edit any field if needed
        • Continue to Step 3 (Non-affiliated authors)
        • Proceed with form submission
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ ✅ COMPLETE - FORM READY FOR SUBMISSION                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        ANGULAR FRONTEND                           │
│                    (research_out_front)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ JournalDetailComponent                                  │    │
│  │ (journal-detail-component.ts)                           │    │
│  │                                                         │    │
│  │ • onStudentEmployeeNoBlur(index)                        │    │
│  │ • checkForSelectedStudent()                             │    │
│  │ • authorLookupLoading {}                                │    │
│  │ • authorLookupErrors {}                                 │    │
│  └────────────┬─────────────────────────────────┬─────────┘    │
│               │                                 │                │
│               ├─ Imports ─ ─ ─ ─ ─ ─ ─── ──────┤                │
│               │ StudentSearch │ AuthorLookup    │                │
│               │ Modal Cmp     │ Service         │                │
│               │               │                 │                │
│        ┌──────▼────────┐   ┌──▼───────────┐   │                │
│        │ StudentSearch │   │ AuthorLookup  │   │                │
│        │ Modal         │   │ Service       │   │                │
│        │ (Component)   │   │               │   │                │
│        │               │   │ • performA...  │   │                │
│        │ • Search UI   │   │ • mapLoginA... │   │                │
│        │ • Modal Logic │   │ • normalize... │   │                │
│        │ • Recent List │   │ • findFacul... │   │                │
│        └───────┬───────┘   └──┬────────────┘   │                │
│                │               │                 │                │
│                └───────────────┼─────────────────┘                │
│                                │                                  │
│                        ┌───────▼──────────┐                      │
│                        │ StudentSearch    │                      │
│                        │ Service          │                      │
│                        │ (Service)        │                      │
│                        │                  │                      │
│                        │ • searchByNum    │                      │
│                        │ • searchDebounce │                      │
│                        │ • mapLoginDto... │                      │
│                        └───────┬──────────┘                      │
│                                │                                  │
└────────────────────────────────┼──────────────────────────────────┘
                                 │
                                 │ HTTP GET
                                 │ /api/user/student-info/{id}
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT BACKEND                            │
│                  (research_output service)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ UserController                                          │    │
│  │ @GetMapping("student-info/{studentNo}")                 │    │
│  │                                                         │    │
│  │ • Receives: studentNo = "EMP001"                        │    │
│  │ • Calls: userService.loadLoginByStaffNo()              │    │
│  │ • Returns: LoginDTO                                     │    │
│  └────────────┬─────────────────────────────────────────┘    │
│               │                                                 │
│               ▼                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ UserService                                             │    │
│  │                                                         │    │
│  │ • loadLoginByStaffNo(staffNo)                          │    │
│  │   └─ Builds HTTP headers with impersonation credential │    │
│  │   └─ Calls Integration API                             │    │
│  │   └─ Parses LoginDTO response                          │    │
│  │   └─ Returns: LoginDTO {                               │    │
│  │      staff: { name, dept, faculty, ... },              │    │
│  │      student: { ... },                                 │    │
│  │      communication: { email, ... }                     │    │
│  │    }                                                    │    │
│  └────────────┬─────────────────────────────────────────┘    │
│               │                                                 │
│               ▼                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ RestTemplate                                            │    │
│  │ (Spring HTTP Client)                                    │    │
│  │                                                         │    │
│  │ Authorization: Basic <impersonation_credential>        │    │
│  │ GET https://univenproduction-integration.[...]         │    │
│  │     /api/user/{staffNo}                                │    │
│  └────────────┬─────────────────────────────────────────┘    │
│               │                                                 │
└───────────────┼──────────────────────────────────────────────────┘
                │
                │ HTTPS
                │
                ▼
┌──────────────────────────────────────────────────────────────────┐
│                 EXTERNAL INTEGRATION API                          │
│            (Azure Microservices - Univen)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  https://univenproduction-integration.azuremicroservices.io/    │
│  api/user/{staffNo}                                              │
│                                                                   │
│  ├─ Student Info Service                                         │
│  ├─ Staff Directory Service                                      │
│  ├─ Communication Records                                        │
│  └─ Department/Faculty Data                                      │
│                                                                   │
│  Returns: LoginDTO {                                             │
│    staff: {                                                      │
│      personNumber,                                               │
│      firstname, surname, initials,                               │
│      gender, birthDate,                                          │
│      faculty, departmentName,                                    │
│      title, postName,                                            │
│      ...                                                         │
│    },                                                            │
│    student: { ... },                                             │
│    communication: { email, cellNo, ... }                         │
│  }                                                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequence

```
┌─────────────────┐
│  Frontend UI    │
└────────┬────────┘
         │
         │ User clicks search button
         ▼
┌─────────────────────────────────┐
│ StudentSearchModalComponent     │
│ - Modal opens                   │
│ - Accepts student number input  │
│ - Performs search on enter      │
└────────┬────────────────────────┘
         │
         │ User types "EMP001" and hits ENTER
         ▼
┌─────────────────────────────────┐
│ StudentSearchService            │
│ - searchByNumber("EMP001")       │
│ - Calls LoginService            │
└────────┬────────────────────────┘
         │
         │ HTTP GET /api/user/student-info/EMP001
         ▼
┌─────────────────────────────────┐
│ Spring Backend - UserController │
│ - Receives: EMP001              │
│ - Calls UserService             │
└────────┬────────────────────────┘
         │
         │ Delegates to UserService.loadLoginByStaffNo()
         ▼
┌─────────────────────────────────┐
│ UserService                     │
│ - Builds Auth Headers           │
│ - Constructs URL                │
│ - Makes REST call               │
└────────┬────────────────────────┘
         │
         │ HTTPS GET to Integration API
         ▼
┌─────────────────────────────────┐
│ External Integration API        │
│ - Queries Student/Staff DB      │
│ - Returns LoginDTO              │
└────────┬────────────────────────┘
         │
         │ JSON Response with staff/student/communication data
         ▼
┌─────────────────────────────────┐
│ Backend - Parse Response        │
│ - Deserialize JSON              │
│ - Validate fields               │
│ - Return to Client              │
└────────┬────────────────────────┘
         │
         │ HTTP 200 + LoginDTO JSON
         ▼
┌─────────────────────────────────┐
│ Frontend - StudentSearchService │
│ - mapLoginDtoToSearchResult()    │
│ - Extract relevant fields       │
│ - Create SearchResult object    │
└────────┬────────────────────────┘
         │
         │ Display result in modal
         ▼
┌─────────────────────────────────┐
│ User sees result in modal       │
│ - Name: Muthu Ramavhunga        │
│ - Dept: Computer Science        │
│ - Faculty: Science              │
│ - [SELECT] button               │
└────────┬────────────────────────┘
         │
         │ User clicks SELECT
         ▼
┌─────────────────────────────────┐
│ Store in SessionStorage         │
│ selectedStudent = {...}         │
│ Modal closes                    │
└────────┬────────────────────────┘
         │
         │ Page reloads OR ngOnInit triggers
         ▼
┌─────────────────────────────────┐
│ JournalDetailComponent          │
│ ngOnInit() → check for selected │
│ studentStudent found in storage │
└────────┬────────────────────────┘
         │
         │ Call onStudentEmployeeNoBlur(0)
         ▼
┌─────────────────────────────────┐
│ AuthorLookupService             │
│ performAuthorLookup()           │
│ - Lookup API again (buffered)   │
│ - Get full response             │
│ - Map all fields                │
└────────┬────────────────────────┘
         │
         │ Form data prepared
         ▼
┌─────────────────────────────────┐
│ Form auto-fill                  │
│ patchValue({                    │
│   firstName, surname, email,    │
│   gender, facultyId, dept... }) │
└────────┬────────────────────────┘
         │
         │ Department dropdownloaded
         ▼
┌─────────────────────────────────┐
│ ✅ Success!                     │
│ Form ready for user review      │
│ Auto-filled fields editable     │
└─────────────────────────────────┘
```

---

## Component Interaction

```
StudentSearchModalComponent
       │
       ├─ Imports
       │  └─ StudentSearchService
       │     ├─ Imports
       │     │  ├─ HttpClient
       │     │  └─ LoginService
       │     │
       │     └─ Methods
       │        ├─ searchByNumber()
       │        ├─ mapLoginDtoToSearch Result()
       │        └─ extractEmail()
       │
       └─ Emits (via sessionStorage)
          └─ selectedStudent: StudentSearchResult

JournalDetailComponent
       │
       ├─ Imports
       │  ├─ StudentSearchModalComponent
       │  ├─ AuthorLookupService
       │  └─ LoginService
       │
       ├─ State
       │  ├─ authorLookupLoading: {}
       │  ├─ authorLookupErrors: {}
       │  └─ departmentsMap: {}
       │
       ├─ Methods
       │  ├─ checkForSelectedStudent()
       │  │  └─ Reads sessionStorage
       │  │     └─ Triggers onStudentEmployeeNoBlur()
       │  │
       │  └─ onStudentEmployeeNoBlur()
       │     └─ Calls AuthorLookupService.performAuthorLookup()
       │
       └─ Uses AuthorLookupService.performAuthorLookup()
          ├─ Calls LoginService.getStudentInfo()
          ├─ Maps response
          ├─ Patches FormGroup
          ├─ Loads departments
          └─ Updates UI state
```

---

## Form Population Map

```
LOGIN DTO RESPONSE          →    FORM FIELDS
┌──────────────────┐             ┌────────────────────┐
│ Staff Object     │             │ Author FormGroup   │
├──────────────────┤             ├────────────────────┤
│ firstname        │────────────→ │ firstName          │
│ surname          │────────────→ │ surname            │
│ initials         │────────────→ │ initials           │
│ gender           │────────────→ │ gender (norm'd)    │
│ birthDate        │────────────→ │ dob (year only)    │
│ title            │────────────→ │ academicTitle      │
│ faculty          │────────────→ │ facultyId (lookup) │
│ departmentName   │────────────→ │ departmentId       │
│ permanentOrTemp  │────────────→ │ employmentStatus   │
│ countryName      │────────────→ │ countryOfBirth     │
│                  │             │                    │
│ Communication    │             │                    │
│ .email           │────────────→ │ email              │
└──────────────────┘             └────────────────────┘
```

---

## State Management Timeline

```
STEP 1: User Lands on Form
────────────────────────────
authorLookupLoading = {}
authorLookupErrors  = {}

STEP 2: User Opens Modal & Searches
────────────────────────────────────
authorLookupLoading = {}
authorLookupErrors  = {}
[Modal fetches data]

STEP 3: User Selects Result
────────────────────────────
sessionStorage['selectedStudent'] = { staffNo, firstName, ... }

STEP 4: Modal Closes, Form Processes
─────────────────────────────────────
checkForSelectedStudent() reads sessionStorage
onStudentEmployeeNoBlur(0) triggered

authorLookupLoading[0] = true
authorLookupErrors[0]  = undefined

STEP 5: API Call in Progress
──────────────────────────────
[HTTP GET /api/user/student-info/EMP001]

STEP 6: Success Response
─────────────────────────
authorLookupLoading[0] = false
authorLookupErrors[0]  = undefined
[Form patches with data]
[Departments load]

STEP 7: Complete
─────────────────
sessionStorage['selectedStudent'] = cleared
Form ready for user
```

---

This comprehensive visual guide helps stakeholders understand both the user experience and the technical flow of the student search system.

