# Student Search - Quick Start Guide

## Quick Usage

### For End Users (Researchers)

#### 1. **Open Journal Details Form**
Navigate to "Add Journal" or edit existing journal.

#### 2. **Find Search Button**
In the **"Affiliated Authors"** section, locate the search icon (magnifying glass) next to the **"Student/Employee No."** field.

```
┌─────────────────────────────────────────┐
│ Affiliated Authors                      │
├─────────────────────────────────────────┤
│ Student/Employee No.  [input] 🔍 ← HERE
│ First Name           [input]
│ Surname              [input]
│ ...
```

#### 3. **Click Search Button**
Modal opens with search interface.

#### 4. **Enter Student Number**
Type the employee or student number (e.g., `EMP001`, `12345`).

#### 5. **Search**
Press **Enter** or click **Search** button.

#### 6. **View Results**
- Name, department, faculty displayed
- Click **Select** button

#### 7. **Auto-Fill Magic ✨**
Form automatically fills:
- ✅ First name, surname, initials
- ✅ Gender, date of birth
- ✅ Faculty & Department (auto-selected)
- ✅ Email address
- ✅ Academic qualifier title
- ✅ Employment status

#### 8. **Continue**
Form is now pre-populated! Complete remaining fields and submit.

---

## For Developers

### Adding Student Search to a New Detail Component

#### Step 1: Import Components & Services
```typescript
import { StudentSearchModalComponent } from '../student-search-modal/student-search-modal.component';
import { AuthorLookupService } from '../../services/author-lookup.service';
```

#### Step 2: Add to Component Imports
```typescript
@Component({
  selector: 'app-my-detail-component',
  templateUrl: '...',
  styleUrls: ['...'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    StudentSearchModalComponent,  // ← Add here
    RouterLink
  ]
})
```

#### Step 3: Inject Dependencies
```typescript
constructor(
  private fb: FormBuilder,
  private router: Router,
  private authorsService: AuthorsService,  // or similar
  private loginService: LoginService,
  private authorLookupService: AuthorLookupService,  // ← Add here
  private cdr: ChangeDetectorRef
) {}
```

#### Step 4: Initialize State
```typescript
faculties: Faculty[] = [];
departmentsMap: { [index: number]: Department[] } = {};
authorLookupLoading: { [index: number]: boolean } = {};
authorLookupErrors: { [index: number]: string } = {};
```

#### Step 5: Add Component Method
```typescript
onStudentEmployeeNoBlur(authorIndex: number): void {
  this.authorLookupService.performAuthorLookup(
    authorIndex,
    this.authorsFA,
    this.faculties,
    this.departmentsMap,
    this.cdr,
    this.authorLookupLoading,
    this.authorLookupErrors
  );
}
```

#### Step 6: Add ngOnInit Check
```typescript
ngOnInit() {
  this.checkForSelectedStudent();
  // ... rest of init
}

private checkForSelectedStudent(): void {
  try {
    const selectedStudentJson = sessionStorage.getItem('selectedStudent');
    if (selectedStudentJson) {
      const student: StudentSearchResult = JSON.parse(selectedStudentJson);
      sessionStorage.removeItem('selectedStudent');

      const authorsFA = this.authorsFA;
      if (authorsFA.length > 0) {
        const firstAuthorFG = authorsFA.at(0) as FormGroup;
        firstAuthorFG.patchValue({ 
          studentEmployeeNo: student.staffNo || student.studentNo 
        });
        setTimeout(() => {
          this.onStudentEmployeeNoBlur(0);
        }, 100);
      }
    }
  } catch (error) {
    console.error('Error processing selected student:', error);
  }
}
```

#### Step 7: Update HTML Template
Find the student number field in your form:
```html
<!-- BEFORE -->
<input class="form-control" formControlName="studentEmployeeNo" />

<!-- AFTER -->
<div class="input-group">
  <input class="form-control" 
         formControlName="studentEmployeeNo"
         (blur)="onStudentEmployeeNoBlur(i)"
         [ngClass]="{'is-invalid': a.get('studentEmployeeNo')?.invalid && a.get('studentEmployeeNo')?.touched}"/>
  <button class="btn btn-outline-secondary" type="button" 
          data-bs-toggle="modal" 
          data-bs-target="#studentSearchModal"
          title="Search for student/staff member">
    <i class="fa fa-search"></i>
  </button>
</div>

<!-- Error/Loading messages -->
<small class="text-muted d-block" *ngIf="isAuthorLookupLoading(i)">
  Loading author info...
</small>
<small class="text-danger d-block" *ngIf="authorLookupErrors[i]">
  {{ authorLookupErrors[i] }}
</small>

<!-- Helper method needed -->
<small class="text-danger" 
       *ngIf="a.get('studentEmployeeNo')?.hasError('required') && a.get('studentEmployeeNo')?.touched">
  Required for affiliated authors
</small>
```

#### Step 8: Add Helper Method
```typescript
isAuthorLookupLoading(index: number): boolean {
  return this.authorLookupLoading[index] === true;
}
```

#### Step 9: Add Modal Component to Template
At the bottom of your template file, before closing `</div>`:
```html
<!-- Student Search Modal -->
<app-student-search-modal></app-student-search-modal>
```

#### Step 10: Load Faculties
Make sure faculties are loaded (usually in ngOnInit):
```typescript
loadFaculties() {
  this.authorsService.getFaculties().subscribe({
    next: (data) => {
      this.faculties = data ?? [];
    },
    error: (err) => {
      console.error('Failed to load faculties', err);
    }
  });
}
```

---

## Testing the Student Search

### Manual Test Steps

1. **Start Backend:**
   ```bash
   mvn spring-boot:run
   ```
   Should run on `http://localhost:8080`

2. **Start Frontend:**
   ```bash
   npm start
   ```
   Should run on `http://localhost:4200`

3. **Navigate to Journal Form:**
   Go to `/journal/create` or similar detail form

4. **Open Search Modal:**
   Click the search icon next to "Student/Employee No."

5. **Try Sample Numbers:**
   - `EMP001`
   - `12345`
   - Any valid staff/student number in your system

6. **Verify Results:**
   - Information should appear in modal
   - Click Select
   - Form fields should auto-populate
   - Faculty dropdown auto-selected
   - Departments loaded for that faculty

### Debugging

#### In Browser DevTools (F12)

**Check selected student in sessionStorage:**
```javascript
JSON.parse(sessionStorage.getItem('selectedStudent'))
```

**Check loading state:**
```javascript
// In component
console.log(this.authorLookupLoading);
console.log(this.authorLookupErrors);
```

**Check API response:**
```javascript
// Network tab → XHR/Fetch
// Look for: GET /api/user/student-info/EMP001
```

#### Backend Logs
```
GET /api/user/student-info/EMP001
→ Calls integration API
→ Returns LoginDTO
→ Check for errors in logs
```

---

## API Integration Points

### Service Methods Used

#### LoginService
```typescript
getStudentInfo(studentNo: string): Observable<any>
```

**Returns:** Complete LoginDTO from integration API

#### StudentSearchService
```typescript
searchByNumber(query: string): Observable<StudentSearchResult | null>
```

**Returns:** Mapped search result or null

#### AuthorLookupService (NEW)
```typescript
performAuthorLookup(
  authorIndex: number,
  authorsFA: FormArray,
  faculties: any[],
  departmentsMap: any,
  cdr: ChangeDetectorRef,
  authorLookupLoading: any,
  authorLookupErrors: any
): void
```

**Does:** Full lookup + form population orchestration

---

## Common Issues & Solutions

### 1. Modal Doesn't Open
**Problem:** Click search button, nothing happens

**Solutions:**
- Check Bootstrap JS is loaded: `<script src="bootstrap.bundle.min.js">`
- Verify `StudentSearchModalComponent` imported in `@Component`
- Check browser console for JavaScript errors

### 2. Form Not Auto-Filling
**Problem:** Click Select in modal, form stays empty

**Solutions:**
- Check `sessionStorage` in DevTools: 
  ```javascript
  sessionStorage.getItem('selectedStudent')
  ```
- Verify `checkForSelectedStudent()` is called in `ngOnInit()`
- Check `onStudentEmployeeNoBlur()` method exists

### 3. "No results found" Error
**Problem:** Valid employee number shows no results

**Solutions:**
- Backend endpoint running? Check `/api/user/student-info/EMP001`
- Integration API accessible? Check network tab
- Valid staff number in target system?
- Try: Open browser console, manually call service:
  ```typescript
  // In component
  this.loginService.getStudentInfo('EMP001').subscribe(console.log);
  ```

### 4. Faculty/Department Not Auto-Selected
**Problem:** Form fills name and email, but dropdowns stay empty

**Solutions:**
- Faculty names must match exactly (case-insensitive)
- Department names must match exactly (case-insensitive)
- Check database spelling vs. API response
- Verify `loadFaculties()` completes before lookup

---

## Code Examples

### Example 1: Manual Lookup (No Modal)
```typescript
// In component
searchStudent(studentNo: string) {
  this.loginService.getStudentInfo(studentNo).subscribe({
    next: (response) => {
      this.authorLookupService.performAuthorLookup(
        0,                    // first author
        this.authorsFA,
        this.faculties,
        this.departmentsMap,
        this.cdr,
        this.authorLookupLoading,
        this.authorLookupErrors
      );
    }
  });
}
```

### Example 2: Recent Search Recovery
```typescript
// In StudentSearchModal Component
private loadRecentSearches(): void {
  try {
    const stored = localStorage.getItem('recentStudentSearches');
    if (stored) {
      this.recentSearches = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading recent searches:', error);
  }
}
```

### Example 3: Error Handling
```typescript
this.authorLookupService.performAuthorLookup(...)
  // Errors handled internally, check:
  this.authorLookupErrors[0]  // string message or undefined
  this.authorLookupLoading[0] // false when complete
```

---

## Performance Tips

1. **Lazy-load departments** - Only fetch after faculty selected ✓
2. **Debounce search input** - 300ms default ✓
3. **Disable button during lookup** - Prevent double requests ✓
4. **Limit recent searches** - 5 items max in localStorage ✓
5. **Manual change detection** - For async operations ✓

---

## Next Steps

- [ ] Add to Books component
- [ ] Add to Chapters component
- [ ] Add to Conference Proceedings component
- [ ] Add name-based search filters
- [ ] Implement bulk import from CSV

---

**Questions?** Check `STUDENT_SEARCH_IMPLEMENTATION.md` for complete documentation.

