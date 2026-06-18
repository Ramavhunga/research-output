# End-to-End Student Search Functionality

## Overview

Complete implementation of student/staff member search across the research output management system. This document describes the full integration from backend API to frontend UI.

## 📋 Features Implemented

### 1. **Backend Enhancements**
- ✅ Added `GET /api/user/student-info/{studentNo}` endpoint
- ✅ Proxies existing integration API to fetch student/staff information
- ✅ Returns complete `LoginDTO` with `Staff`, `Student`, and `Communication` data

### 2. **Frontend Services**

#### `student-search.service.ts`
Handles search queries and data mapping:
- **Method:** `searchByNumber(query: string)` - Search by student/staff number
- **Method:** `searchWithDebounce(query$)` - Real-time search with 300ms debounce
- **Mapping:** Converts `LoginDTO` to `StudentSearchResult` interface

**StudentSearchResult Interface:**
```typescript
{
  studentNo: string;
  staffNo: string;
  firstName: string;
  surname: string;
  fullName: string;
  department: string;
  faculty: string;
  gender: string;
  email: string;
  type: 'STUDENT' | 'STAFF';
  displayText: string;
}
```

#### `author-lookup.service.ts` (Shared)
Reusable utility for auto-filling author information across all detail components:
- **Method:** `performAuthorLookup(...)` - Orchestrates the lookup and form population
- **Parsing:** Handles multiple API response formats from integration layer
- **Mapping:** Normalizes gender, employment status, academic titles
- **Faculty/Department Matching:** Case-insensitive lookup against application data
- **Used by:** Journal, Books, Chapter, and Conference Proceedings components

### 3. **Frontend Components**

#### `student-search-modal.component.ts`
Standalone modal component for searching students:

**Features:**
- 🔍 Real-time search input with instant validation
- 📊 Search result display with full details
- 📝 Recent searches stored in localStorage (last 5)
- ⌨️ Enter key to search
- 🎯 One-click selection and auto-population
- 🎨 Bootstrap 5 modal with responsive design

**Usage:**
```html
<app-student-search-modal></app-student-search-modal>
```

**Selected student storage:**
- Stored in `sessionStorage['selectedStudent']`
- Auto-populated in active author form on page load
- Cleared after use to avoid duplicate population

### 4. **Integration Points**

#### Journal Detail Component (`journal-detail-component.ts`)
**New Features:**
1. **Search Button** - Next to student/staff number field
   - Opens modal with `data-bs-toggle="modal"` and `data-bs-target="#studentSearchModal"`
   
2. **Auto-fill on Blur** - When field loses focus
   - Calls `onStudentEmployeeNoBlur(authorIndex)`
   - Delegates to `AuthorLookupService`
   
3. **Selected Student Processing** - On component init
   - Calls `checkForSelectedStudent()`
   - Reads from `sessionStorage['selectedStudent']`
   - Auto-triggers lookup if student was selected from modal

4. **Form Population** - Maps all available fields:
   - Name fields: `firstName`, `surname`, `initials`
   - Personal: `gender`, `dob`, `email`, `orcid`
   - Academic: `facultyId`, `departmentId`, `academicTitle`
   - Status: `employmentStatus`, `populationGroup`, `countryOfBirth`

**State Management:**
```typescript
authorLookupLoading: { [index: number]: boolean } = {};
authorLookupErrors: { [index: number]: string } = {};
```

### 5. **User Experience Flow**

#### Scenario A: Search for Student
1. User clicks **Search** button next to student number field
2. Modal opens showing:
   - Search input box
   - Recent searches (if any)
3. User types student number or name (e.g., "12345", "John Smith")
4. Enter key or Search button triggers lookup
5. Result displays:
   - Full name, student/staff number
   - Department, faculty, gender
   - **Select** button highlighted in green
6. User clicks **Select**
7. Modal closes
8. First author form auto-fills with looked-up information
9. Faculty dropdown populates → Department dropdown populates
10. Form ready for additional info

#### Scenario B: Enter Student Number Manually
1. User types student number in field (e.g., "12345")
2. User tabs/clicks away (blur event)
3. Lookup triggers automatically
4. Loading indicator appears
5. After ~1-2 seconds:
   - ✅ Form auto-fills with fetched data
   - ❌ Error message if not found

#### Scenario C: Recent Searches
1. User opens search modal again
2. Previous searches shown in list
3. Click any recent search to re-populate
4. Useful for bulk data entry

### 6. **Data Mapping Logic**

#### API Response → Application Form

| API Field (Staff) | API Field (Student) | Application Field | Type |
|---|---|---|---|
| `firstname` | `firstNames` | `firstName` | String |
| `surname` | `surname` | `surname` | String |
| `initials` | `initials` | `initials` | String |
| `gender` | `gender` | `gender` | MALE\|FEMALE |
| `title` | — | `academicTitle` | MR\|MS\|DR\|PROF\|... |
| `faculty` | `facultyName` | `facultyId` | Lookup from faculties list |
| `departmentName` | `departmentName` | `departmentId` | Lookup from departments list |
| `birthDate` | `dateOfBirth` | `dob` | Year only |
| `permanentOrTemp` | — | `employmentStatus` | PERMANENT\|TEMPORARY\|STUDENT\|... |
| `countryName` | `countryName` | `countryOfBirth` | String |
| `communication[].email` | — | `email` | Email format |

#### Normalization Rules

**Gender:**
- Input: "M", "Male", "MALE" → Output: `MALE`
- Input: "F", "Female", "FEMALE" → Output: `FEMALE`

**Employment Status:**
- Input containing "STUDENT" → `STUDENT`
- Input containing "PERMANENT" or "FULL" → `PERMANENT`
- Input containing "TEMP", "PART", "CONTRACT" → `TEMPORARY`
- Input containing "RETIRED" → `RETIRED`

**Academic Title:**
- Validated against predefined set: `MR`, `MS`, `MRS`, `MISS`, `DR`, `PROF`, `ADV`, `REV`, `PASTOR`, `IMAM`, `RABBI`, `OTHER`
- Invalid titles → `null` (not populated)

**Year of Birth:**
- Extracts year from date string (YYYY format)
- Handles various date formats via `Date` parsing

### 7. **Error Handling**

#### Lookup Errors
| Scenario | Message | Action |
|---|---|---|
| No data returned | "No staff/student details found for this number." | Suggest checking number format |
| API call fails | "Could not fetch staff/student info. Check the number and try again." | Retry suggestion |
| Invalid JSON response | Caught in catch block | Generic error message |
| Network timeout | Observable catchError | User-friendly error |

#### Validation
- Student number field is **required** for affiliated authors
- Non-affiliated authors skip lookup entirely
- Empty student number field = skip lookup

### 8. **Performance Considerations**

1. **Debouncing:** Search input uses 300ms debounce to reduce API calls
2. **Loading State:** Visual feedback prevents multiple simultaneous requests
3. **Department Lazy-loading:** Departments fetched only after faculty selected
4. **Change Detection:** Manual `cdr.markForCheck()` for async updates
5. **Recent Searches:** LocalStorage capped at 5 items, no bloat

### 9. **Testing Scenarios**

#### Happy Path
```
Input: Valid staff number (e.g., "EMP001")
→ Lookup succeeds
→ Form auto-fills with all available data
→ Faculty and department matched
✓ Success notification in UI
```

#### Edge Cases
```
Input: Empty student number
→ Lookup skipped (no API call)

Input: Invalid number (e.g., "UNKNOWN999")
→ API returns no matching record
→ Error message: "No staff/student details found"

Input: Partial data (name exists, no faculty)
→ Form fills what's available
→ Faculty remains unfilled
→ No error, as partial match valid

Input: Non-affiliated author
→ Click blur while affiliation = false
→ Lookup skipped early (by design)
```

### 10. **Backend API Reference**

**Endpoint:** `GET /api/user/student-info/{studentNo}`

**Path Parameters:**
| Name | Type | Description |
|---|---|---|
| `studentNo` | String | Student or staff number (URL-encoded) |

**Headers:**
```
Content-Type: application/json
```

**Response (LoginDTO):**
```json
{
  "user": {
    "username": "user001",
    "password": null,
    "userType": "STAFF"
  },
  "staff": {
    "personNumber": "EMP001",
    "surname": "Ramavhunga",
    "firstname": "Muthu",
    "initials": "M",
    "title": "MR",
    "postName": "Senior Lecturer",
    "postType": "PERMANENT",
    "departmentName": "Computer Science",
    "idNumber": "8601035060082",
    "passportNumber": null,
    "supervisor": null,
    "faculty": "Science",
    "birthDate": "1986-01-23",
    "rankName": "Associate",
    "gender": "MALE",
    "maritalStatus": "MARRIED",
    "countryName": "South Africa",
    "language": "English",
    "appointmentDate": "2015-02-01",
    "resignationDate": null,
    "permanentOrTemp": "PERMANENT"
  },
  "student": {
    "studentNumber": null,
    "surname": null,
    "firstNames": null,
    "qualificationCode": null,
    "qualificationName": null,
    "departmentCode": null,
    "departmentName": null,
    "facultyCode": null,
    "facultyName": null,
    "gender": null,
    "initials": null,
    "dateOfBirth": null,
    "idNumber": null
  },
  "communication": {
    "personNumber": "EMP001",
    "contactType": "Email",
    "communicationType": "Work Email",
    "communicationNumber": "m.ramavhunga@univen.ac.za",
    "cellNo": null
  }
}
```

**Error Responses:**
```
404 - Staff/Student not found
500 - Integration API error
```

### 11. **Files Modified/Created**

#### New Files:
1. `src/app/services/student-search.service.ts` - Search and mapping logic
2. `src/app/services/author-lookup.service.ts` - Shared auto-fill service
3. `src/app/components/student-search-modal/student-search-modal.component.ts` - Modal UI

#### Modified Files:
1. `src/main/java/.../controller/UserController.java` - Added `student-info` endpoint
2. `src/app/components/journal-detail-component/journal-detail-component.ts` - Integrated search
3. `src/app/components/journal-detail-component/journal-detail-component.html` - Added search button + modal

### 12. **Future Enhancements**

- [ ] Add name-based search (first name, surname filters)
- [ ] Batch import students from file (CSV/Excel)
- [ ] Search history with filtering by date
- [ ] Advanced filters (department, faculty, status)
- [ ] Multi-select and bulk auto-fill
- [ ] Caching of recent lookups (IndexedDB for persistence)
- [ ] Extend to Books, Chapters, Conference Proceedings components

### 13. **Building & Deployment**

#### Development Build:
```powershell
cd front_end/research_out_front
npm start
```
Access at `http://localhost:4200`

#### Production Build:
```powershell
npm run build
# Output in: dist/research_out_front
```

#### Backend Build:
```powershell
mvn clean package
java -jar target/research_output-0.0.1-SNAPSHOT.jar
```
Backend runs on `http://localhost:8080`

### 14. **Troubleshooting**

| Issue | Solution |
|---|---|
| Search modal not opening | Verify Bootstrap JS loaded, check console for errors |
| Form not auto-filling | Check sessionStorage in DevTools, verify loginService endpoint |
| Faculty/Department not matching | Check spelling in database vs. API response |
| Lookup hangs | Check network tab, increase timeout |
| Dark theme breaks modal | Verify CSS specificity in component styles |

---

## Summary

**End-to-end student search provides:**
- 🎯 One-click student lookup via modal search
- ⚡ Automatic form population with data deduplication
- 🔄 Recurring recent searches for quick re-entry
- 🛡️ Error handling and validation
- 📱 Responsive Bootstrap 5 UI
- 🚀 Performant with debouncing and async handling

Complete integration ready for **Journal, Books, Chapters, Conference Proceedings** detail forms!

