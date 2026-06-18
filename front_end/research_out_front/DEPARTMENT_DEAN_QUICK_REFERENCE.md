# Department Dean Assignment - Quick Reference

## Quick Start

### Access the Page
- **URL**: `http://localhost:4200/admin/department-dean`
- **Route**: `/admin/department-dean`
- **Requirement**: Must be logged in as ADMIN user

### 5-Step Assignment Process

1. **Select Faculty**
   ```
   Faculty Dropdown → Choose Faculty Name
   ```

2. **Select Department** 
   ```
   Department Dropdown → Choose Department (auto-populated from faculty)
   ```

3. **Enter Staff Number**
   ```
   Staff Number Input → Type employee staff number
   ```

4. **Search for Employee**
   ```
   Click "Search Employee" button
   → Verify staff details appear
   ```

5. **Assign as Dean**
   ```
   Click "Assign as Dean" button
   → Confirm in dialog
   → Success message confirms assignment
   ```

## Data Flow Diagram

```
┌──────────────────┐
│   Start Page     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│ Select Faculty       │ ← GET /api/facultydepartment/faculties
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Select Department    │ ← GET /api/facultydepartment/faculties/{id}/departments
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Enter Staff Number   │
│ Click Search         │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Find Staff           │ ← GET /user/roles/staff/{staffNo}
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Display Staff        │
│ Details              │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Click Assign         │
│ Confirm              │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Assignment Complete  │ → POST /api/facultydepartment/department/{id}/dean
└──────────────────────┘
```

## Component Structure

### Main Template Sections

```html
├── Page Header
│   └── Breadcrumb Navigation
│
├── Selection Area
│   ├── Faculty Dropdown
│   └── Department Dropdown
│
├── Search Area (conditional)
│   ├── Staff Number Input
│   ├── Search Button
│   └── Staff Details Display
│
├── Action Buttons
│   ├── Assign as Dean
│   └── Clear Form
│
└── Instructions Card
    └── 5-Step Process Guide
```

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/facultydepartment/faculties` | All faculties |
| GET | `/api/facultydepartment/faculties/{facultyId}/departments` | Departments by faculty |
| GET | `/user/roles/staff/{staffNo}` | Staff details by number |

## File Locations

```
Frontend
├── src/app/components/department-dean-assignment-component/
│   ├── department-dean-assignment-component.ts
│   ├── department-dean-assignment-component.html
│   └── department-dean-assignment-component.css
│
├── src/app/services/
│   ├── faculty-department.service.ts
│   └── user-role.service.ts (existing)
│
├── src/app/models/
│   ├── common.model.ts (Faculty, Department)
│   └── department-dean.model.ts
│
└── src/app/app.routes.ts (route configuration)
```

## Key Properties and Methods

### Component Properties
```typescript
faculties: Faculty[]                    // List of all faculties
departments: Department[]               // Departments for selected faculty
selectedFacultyId: number | null       // Selected faculty ID
selectedDepartmentId: number | null    // Selected department ID
selectedStaff: StaffRoleView | null    // Found staff member details
searchStaffNo: string                  // Staff number input
searching: boolean                      // Search in progress flag
saving: boolean                         // Assignment in progress flag
loadingFaculties: boolean               // Faculties loading flag
loadingDepartments: boolean             // Departments loading flag
```

### Key Methods
| Method | Purpose |
|--------|---------|
| `ngOnInit()` | Load faculties on component init |
| `loadFaculties()` | Fetch all faculties from API |
| `onFacultyChange()` | Load departments when faculty selected |
| `onDepartmentChange()` | Reset staff selection on department change |
| `searchByStaffNo()` | Find staff by number |
| `assignDean()` | Assign staff member as dean |
| `resetForm()` | Clear all form fields |
| `isFormValid()` | Check if form is ready to submit |

## Validation Rules

```typescript
Faculty Required?      YES  - Must select one
Department Required?   YES  - Must select one
Staff Number Required? YES  - Must be entered
Staff Must Exist?      YES  - Must be found in system
All Fields Valid?      YES  - Required before submission
```

## Display States

### Loading State
- Spinner icons appear next to dropdowns
- Buttons show "Loading..." text
- Inputs may be disabled

### Error State
- Red error message displayed
- Error icon shown
- User prompted to retry

### Success State
- Green confirmation message
- Form resets
- Success notification sent

### Disabled Button Conditions
| Button | Disabled When |
|--------|---------------|
| Refresh | Faculty loading in progress |
| Assign | Any field invalid or saving |
| Search | Staff number empty or searching |

## Common Scenarios

### Scenario 1: Assign Dean from Faculty A to Dept B
```
1. Select "Faculty A" → Departments load
2. Select "Department B" → Search field appears
3. Enter "12345" → Click Search
4. Verify details → Click Assign
5. Confirm → Success
```

### Scenario 2: Change Mind and Start Over
```
1. Fill form partially
2. Click "Clear" button
3. All fields reset
4. Start fresh
```

### Scenario 3: Staff Not Found
```
1. Enter invalid staff number
2. Click Search
3. Error alert shown
4. Re-enter correct number
5. Try search again
```

## Styling Classes Used

| Class | Purpose |
|-------|---------|
| `.pc-container` | Main container |
| `.page-header` | Page title area |
| `.card` | Card component |
| `.btn-primary` | Primary action button |
| `.btn-success` | Success action button |
| `.form-select` | Dropdown select |
| `.form-label` | Form labels |
| `.alert-info` | Information messages |
| `.badge` | Status badges |

## Performance Tips

1. **Lazy Load**: Departments only load when faculty selected
2. **Debounce**: Search input could be debounced (not implemented yet)
3. **Cache**: Faculty list caches after first load
4. **Optimize**: Avoid unnecessary re-renders with OnPush strategy (future)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (responsive)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Navigate between fields |
| Enter | Submit search or form |
| Escape | Close confirmation dialog |

## Security Notes

- ADMIN role required (verified by AuthGuard)
- CSRF protection via Angular HTTP client
- XSS protection via sanitization
- Staff data treated as sensitive

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Empty faculty list | Check API connectivity |
| Department not loading | Verify faculty selection |
| Staff not found | Confirm staff number exists |
| Submission fails | Check network/backend |

---

**For detailed information**, see: `DEPARTMENT_DEAN_IMPLEMENTATION.md`

