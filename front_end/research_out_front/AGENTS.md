# ResearchOutFront - Agent Developer Guide

## Project Overview
**ResearchOutFront** is an Angular 20 research output management system for tracking academic publications (journals, books, chapters, conference proceedings) and calculating research unit allocations across multiple institutions. The frontend connects to Azure microservices backend APIs.

**Stack:** Angular 20 (standalone components), RxJS, Bootstrap 5, TypeScript 5.8, Jasmine/Karma testing

---

## Architecture & Key Components

### Directory Structure
```
src/
├── app/
│   ├── components/          # Standalone feature components
│   ├── services/            # Data services with HttpClient
│   ├── guards/              # Route guards (AuthGuard)
│   ├── interface/           # Data contracts (User, LoginDTO, etc.)
│   ├── models/              # Domain models (ResearchOutput, Journal, etc.)
│   ├── app.routes.ts        # Standalone routing config
│   └── app.ts               # Root app component
├── environment/
│   └── environment-url.ts   # Backend API URLs (localhost:8080 dev, Azure prod)
├── css/                     # Global stylesheets
├── js/                      # Third-party scripts (charts, i18n, theme)
└── fonts/                   # Icon fonts
```

### Core Architecture Patterns

**Standalone Components Model:**
- All components use standalone API (`@Component({ imports: [...] })`)
- No NgModules - routing handled via `app.routes.ts` with lazy-loaded children
- Components declare their dependencies inline

**Service Layer:**
```typescript
// All services use root providedIn pattern
@Injectable({ providedIn: 'root' })
export class ServiceName {
  constructor(private http: HttpClient) {}
}
```

**Component Structure:**
Each feature component follows: `feature.ts` (logic) + `feature.html` (template) + `feature.css` (styles)  
Example: `research-output/research-output.ts`, `research-output.html`

**Authentication:**
- Custom AuthGuard checks `sessionStorage.getItem('login')` 
- Currently disabled (commented) on protected routes but pattern is in place
- Session data: `{ user: { username, ...}, ... }` stored as JSON

---

## Critical Data Flows

### 1. Login Flow
```
LoginComponent (form) → LoginService.login() → HTTP POST to /api/user/login 
→ Response stored in sessionStorage['login'] 
→ Navigate to /dashboard
```
**Key:** AuthGuard relies on this sessionStorage key. Session includes user metadata.

### 2. Research Output Loading
```
ResearchOutputComponent.ngOnInit() 
→ Get username from sessionStorage['login'].user.username
→ ResearchOutputService.load_research_outputs(username) 
→ HTTP GET /api/research-outputs/load/{username}
→ Display in component.researchOutputs[]
```

### 3. Unit Calculation (Journals/Books/Chapters/Proceedings)
Complex business logic in `*-detail-component.ts`:
- Form-driven with stepper (multiple steps)
- Core method: `calculateAdvancedUnitBreakdown()` applies these rules:
  1. Total units ÷ affiliated authors = per-author share
  2. Multiple universities = split equally per author
  3. **UNIVEN + Research Company = full unit to UNIVEN** (special rule)
  4. Research-only = 0 units to UNIVEN
- Form arrays handle dynamic author affiliations
- `valueChanges` subscription triggers recalculation on any change

---

## Development Workflows

### Build & Serve
```powershell
npm start              # ng serve (development, localhost:4200, hot reload)
npm run build          # Production build to dist/
npm run watch          # Watch mode build
npm run serve:ssr:research_out_front  # SSR mode
```

### Code Generation
```powershell
ng generate component components/new-feature        # Creates component with template
ng generate service services/new-service            # Creates injectable service
ng generate guard guards/new-guard                  # Creates route guard
ng generate interface interface/new-interface      # Creates data contract
```

### Testing
```powershell
npm test               # Karma + Jasmine, watch mode
# Test files: **/*.spec.ts (co-located with source)
```

### Configuration
- **Dev API:** `environment/environment-url.ts` → `http://localhost:8080/`
- **Prod API:** Azure microservices endpoint (URLs hardcoded in some services)
- **Build budgets:** 3MB initial warning, 5MB error (Angular config)

---

## Project-Specific Conventions

### Naming & Patterns
- **Components:** PascalCase class + component suffix (e.g., `ResearchOutputComponent`)
- **Services:** PascalCase class (last word typically singular or generic "Service")
- **Routes:** kebab-case (e.g., `/manage-submissions`, `/research-output/create`)
- **Models:** PascalCase interfaces, often with nested interfaces (see `research-output.model.ts` with Author, Outlet, Indexing, Access, Funding)

### Error Handling
```typescript
// Standard pattern: catchError + SweetAlert2 notification
service.method().pipe(
  catchError(error => {
    Swal.fire("Title", "Error message", "error");
    return of();  // Return empty observable
  })
).subscribe(data => { ... });
```

### Navigation & State Passing
```typescript
// Navigate with component state (for detail views)
this.router.navigate(['/research-output/create'], { state: { output } });

// Retrieve in target component
const state = this.router.getCurrentNavigation()?.extras.state || {};
const output = state.output;
```

### Reactive Forms
```typescript
// FormGroup pattern with validation
loginForm = new FormGroup({
  username: new FormControl('', Validators.required),
  password: new FormControl('', Validators.required),
});

// Submission: getRawValue(), convert to DTO, POST
const user = this.loginForm.getRawValue();
this.service.submit(user).subscribe(...);
```

### Dynamic Form Arrays (Affiliations Pattern)
```typescript
// In component: authors is FormArray
authors.push(this.newAuthor());  // Add form group to array
getUniversityAffiliations(authorFG) { return authorFG.get('universityAffiliations') as FormArray; }
removeUniversityAffiliation(i, j) { this.getUniversityAffiliations(authors.at(i)).removeAt(j); }
```

---

## External Dependencies & Integration Points

### Key Libraries
- **@angular/*:** Core framework (20.1)
- **rxjs:** Observable streams for async operations
- **sweetalert2:** Toast/dialog notifications (used instead of native alert)
- **bootstrap 5:** Responsive grid/component CSS
- **@fortawesome/fontawesome-free:** Icon library

### Backend APIs (Azure Microservices)
- `/api/user/login` - Authentication
- `/api/user/student-info/{studentNo}` - Student metadata
- `/api/research-outputs/load/{username}` - Fetch outputs by author
- `/api/research-outputs/submissions/{status}` - Fetch submissions by status
- Various endpoints for journals, books, chapters, conference proceedings

### Third-Party Scripts (Loaded via angular.json)
- ApexCharts (charting in dashboard)
- i18next (internationalization setup)
- Bootstrap JS (modals, dropdowns)
- Custom theme/layout JS (pcoded.js, theme.js)

---

## Common Workflows for AI Agents

### Adding a New Feature Module
1. Create component: `ng generate component components/feature-name`
2. Define route in `app.routes.ts` under appropriate parent
3. Create service if needed: `ng generate service services/feature-name-service`
4. Define data interfaces in `interface/` folder
5. Use standalone @Component with required imports
6. Subscribe to service observables in `ngOnInit()`
7. Handle errors with SweetAlert2
8. Add unit tests in `*.spec.ts` using Jasmine

### Modifying Calculation Logic
- **Where:** `*-detail-component.ts` (journal, books, chapter, proceedings)
- **Key method:** `calculateAdvancedUnitBreakdown()`
- **Pattern:** Iterate authors → check affiliations → apply unit rules
- **Trigger:** Form `valueChanges` subscription in `setupAutoCalc()`
- **Display:** Update `unitBreakdown` property, template shows via string interpolation

### Adding Authentication to a Route
- Uncomment `canActivate: [AuthGuard]` in route definition
- Guard checks `sessionStorage.getItem('login')` existence
- If missing, redirects to `/login` and returns false
- Current state: Most routes unguarded (commented out)

### Connecting to New Backend Endpoint
1. Create/update service method: `serviceName.methodName(params): Observable<Model>`
2. Define response model if needed in `models/` or `interface/`
3. In component, call service and subscribe with error pipe
4. Expect API URLs either from `environment.apiUrl` or hardcoded
5. Always set `{ headers: {'Content-Type': 'application/json'} }` for HTTP calls

---

## Known Patterns & Gotchas

### Session Management
- **No logout method implemented** - only sessionStorage.removeItem('login') pattern assumed
- **No token refresh** - assumes backend maintains session during request
- Type-safe access: `JSON.parse(sessionStorage.getItem('login')).user.username`

### Form Handling
- Stepper components for multi-step forms (journal/books/etc detail views)
- FormArrays for dynamic additions (authors, affiliations)
- **Auto-calculation:** Form changes trigger recalculation (can be expensive with many authors)
- **Form persistence:** Manual handling via `getRawValue()` before submit

### Component State
- **No centralized state management** (no NgRx/RxJS BehaviorSubjects)
- Each component manages its own state in properties
- Data passed via router navigation state object
- Async operations directly in components (no facade pattern)

### CSS & Styling
- Global styles in `src/styles.css` + `src/css/style.css`
- Component-scoped styles via `styleUrl: './component.css'`
- Bootstrap 5 utility classes for responsive layout
- Icon fonts: Feather, FontAwesome, Material, Tabler

### Testing Notes
- Test files co-located with components (`*.spec.ts`)
- Karma configuration in `angular.json`
- Current setup includes Jasmine + Chrome Launcher
- No existing comprehensive test suite observed (opportunity area)

---

## Debugging & Development Tips

### Common Commands
```powershell
# Development server with full recompilation
npm start

# Build for production (minified, optimized)
npm run build

# Run tests in watch mode
npm test

# Serve production build locally via Express (SSR enabled)
npm run serve:ssr:research_out_front
```

### Breakpoints
- Use `debugger;` keyword in TypeScript (seen in login component)
- Open Chrome DevTools (F12) to step through, inspect variables
- Check `sessionStorage` in DevTools Console for auth state

### Console Logging
- Pattern: `console.log('context:', data)` throughout codebase
- Useful for debugging async flows and form value changes
- Remove before production

### Browser Compatibility
- Target: Modern browsers (Angular 20 requires ES2022+)
- SSR support enabled (main.server.ts, app.routes.server.ts, app.config.server.ts)
- No IE11 support

---

## Files to Know

| File | Purpose |
|------|---------|
| `app.routes.ts` | Master route definitions, child routes under `/` |
| `app.config.ts` | HTTP/RxJS configuration, global providers |
| `environment/environment-url.ts` | Backend API base URL (dev/prod) |
| `services/login.service.ts` | Entry point for all auth |
| `guards/auth.guard.ts` | Route protection logic |
| `interface/` | Data contracts (User, LoginDTO, etc.) |
| `models/` | Domain models (ResearchOutput hierarchy) |
| Component `*-detail-component.ts` | Unit calculation logic (journals, books, etc.) |
| `IMPLEMENTATION_UNIT_CALCULATION.md` | Detailed affiliation/unit rules (essential reading!) |

---

## When Modifying This Codebase

✅ **DO:**
- Maintain standalone component pattern (no NgModules)
- Use root-providedIn services for dependency injection
- Add error handling with SweetAlert2 notifications
- Keep models/interfaces properly organized by domain
- Test form changes with setupAutoCalc() triggers
- Check environment URL configuration for API endpoints
- Document calculation changes in comments (affiliation logic is complex and domain-specific)

❌ **DON'T:**
- Create NgModules (not the pattern here)
- Use two-way binding ([(ngModel)]) for complex forms—stick with FormBuilder + reactive
- Directly manipulate DOM (use Angular templates)
- Store sensitive data in sessionStorage without encryption (auth currently in plain JSON)
- Hardcode API URLs (use environment-url.ts)
- Skip error handling on service calls (pattern: SweetAlert2 + catchError)
- Forget that `*-detail-component` logic is intricate—read IMPLEMENTATION_UNIT_CALCULATION.md first

---

## References
- [Angular 20 Docs](https://angular.dev)
- [TypeScript 5.8 Handbook](https://www.typescriptlang.org/docs/)
- [RxJS Operators](https://rxjs.dev/guide/operators)
- [Local File](./IMPLEMENTATION_UNIT_CALCULATION.md) - Unit calculation rules (MUST READ for research output features)

