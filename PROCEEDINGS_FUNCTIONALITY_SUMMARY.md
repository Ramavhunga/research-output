# Return Saved Proceedings Functionality - Implementation Summary

## Overview
Implemented a comprehensive "return saved proceedings" functionality for Conference Proceedings, mirroring the existing Journal system. This enables users to save, retrieve, submit, review, and approve/reject conference proceedings with full status tracking and audit trails.

## Changes Made

### 1. New Entities and Enums

#### Created: `ProceedingsStatus.java`
- Enum defining status lifecycle for conference proceedings
- Statuses: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW_L1`, `UNDER_REVIEW_L2`, `REJECTED_L1`, `REJECTED_L2`, `READY_FOR_POSTING`, `UNDER_REVIEW`, `REVISION_REQUIRED`, `APPROVED`, `REJECTED`

### 2. Updated Entities

#### Modified: `ConferenceProceedings.java`
- **Added status tracking**: `@Enumerated(EnumType.STRING) ProceedingsStatus status`
- **Added user relationship**: `@ManyToOne User submittedBy` (replaced simple username string)
- **Added timestamps**: `LocalDateTime createdAt` and `LocalDateTime updatedAt`
- **Added lifecycle methods**: `@PrePersist` and `@PreUpdate` for automatic timestamp management
- **Added JSON serialization**: `getSubmittedByForJson()` method for proper user info in responses

### 3. New DTOs

#### Created: `ConferenceProceedingsListItemDto.java`
- Summary DTO for listing proceedings without full object details
- Fields: `id`, `dhetNo`, `yearOfPublication`, `status`, `titleOfContribution`, `publisher`, `isbn`, `submittedByUsername`, `updatedAt`

#### Created: `ProceedingsDecisionRequest.java`
- Request DTO for submit/approve/reject operations
- Contains optional `comments` field

#### Created: `ProceedingsStatusUpdateRequest.java`
- Request DTO for status transitions
- Contains required `status` field

### 4. Enhanced Repository

#### Modified: `ConferenceProceedingsRepository.java`
- Added `findBySubmittedByUsername(String username)` - retrieve all proceedings by user
- Added `findSummaryBySubmittedByUsername(String username)` - retrieve summary list by user
- Added `search()` - search by year, status, and faculty
- Added `searchSummary()` - search with summary projection
- Added performance indexes for status, submitted_by, and composite queries

### 5. Enhanced Service

#### Rewritten: `ConferenceProceedingsService.java`
- **createOrUpdate()**: Create or update proceedings with user ownership tracking and validation
- **submitForReview()**: Submit proceedings for review (transitions to UNDER_REVIEW_L1)
- **approve()**: Approve proceedings (with role-based workflow)
- **reject()**: Reject proceedings with comments
- **transitionStatus()**: Direct status transition with validation
- **getById()**: Retrieve single proceedings with lazy loading initialization
- **findAll()**: Retrieve all proceedings
- **findAll(year, status, faculty)**: Search proceedings with filters
- **findAllSummary()**: Get summary list for search/dashboard
- **findAllForUser()**: Retrieve saved proceedings for current user
- **findAllSummaryForUser()**: Get summary list for current user
- **delete()**: Delete proceedings
- **enforceEditable()**: Authorization checks for editing based on status and role
- **validateBeforeSave()**: Validate author information before saving
- **linkGraph()**: Link related entities (authors, affiliations) properly

### 6. Enhanced Controller

#### Rewritten: `ConferenceProceedingsController.java`
- **POST /api/conference-proceedings**: Create new proceedings (requires X-Username header)
- **PUT /api/conference-proceedings/{id}**: Update existing proceedings
- **PATCH /api/conference-proceedings/{id}/status**: Transition status
- **GET /api/conference-proceedings/{id}**: Retrieve single proceedings
- **GET /api/conference-proceedings**: List proceedings with filtering
  - Query params: `yearOfPublication`, `status`, `facultyId`, `mine` (for user-specific), `summary` (DTO projection)
- **GET /api/conference-proceedings/exists**: Check if title+isbn already exist
- **POST /api/conference-proceedings/{id}/submit**: Submit for review
- **POST /api/conference-proceedings/{id}/approve**: Approve proceedings (with comments)
- **POST /api/conference-proceedings/{id}/reject**: Reject proceedings (with comments)
- **DELETE /api/conference-proceedings/{id}**: Delete proceedings

### 7. Database Schema

#### Modified: `schema.sql`
- Added `status` column (nvarchar(50)) to conference_proceedings table
- Added `submitted_by` column (bigint FK to users) to conference_proceedings table
- Added `created_at` and `updated_at` timestamp columns to conference_proceedings table
- Created 4 performance indexes:
  - `IX_conference_proceedings_status` - for status filtering
  - `IX_conference_proceedings_submitted_by` - for user-specific queries
  - `IX_conference_proceedings_created_at` - for time-based sorting
  - `IX_conference_proceedings_status_submitted_by` - for complex review queue queries

## Key Features

### 1. User-Based Proceedings Management
- Each proceedings is linked to a submitting user
- Users can save drafts and retrieve their own saved proceedings
- Query: `GET /api/conference-proceedings?mine=true`
- Query: `GET /api/conference-proceedings?mine=true&summary=true`

### 2. Status Workflow
- **DRAFT** → `SUBMITTED` → `UNDER_REVIEW_L1` → `UNDER_REVIEW_L2` → `READY_FOR_POSTING`
- Rejection branches: `REJECTED_L1`, `REJECTED_L2`
- Role-based approval requirements:
  - Level 1 reviewers can approve from SUBMITTED to UNDER_REVIEW_L2
  - Level 2 reviewers can approve from UNDER_REVIEW_L2 to READY_FOR_POSTING

### 3. Authorization & Security
- Owner can only edit rejected proceedings
- Reviewers can edit proceedings assigned to their level
- Admins can edit at any stage except READY_FOR_POSTING
- Comments required for approval/rejection

### 4. Data Validation
- At least one author required
- At least one affiliated author required
- Author details (name, email) required
- University names required for affiliations

### 5. Audit Trail
- Automatic `createdAt` timestamp on creation
- Automatic `updatedAt` timestamp on every modification
- User tracking via `submittedBy` relationship

## Usage Examples

### Save Proceedings as Draft
```
POST /api/conference-proceedings
Headers: X-Username: researcher@example.com
Body: {
  "titleOfContribution": "AI in Research",
  "publisher": "IEEE",
  "authors": [...],
  ...
}
```

### Retrieve User's Saved Proceedings
```
GET /api/conference-proceedings?mine=true
Headers: X-Username: researcher@example.com
```

### Submit Proceedings for Review
```
POST /api/conference-proceedings/1/submit
Headers: X-Username: researcher@example.com
Body: {
  "comments": "Please review this proceedings"
}
```

### Approve Proceedings (Level 1 Reviewer)
```
POST /api/conference-proceedings/1/approve
Headers: X-Username: reviewer@example.com
Body: {
  "comments": "Approved for Level 2 review"
}
```

### Search with Filters
```
GET /api/conference-proceedings?yearOfPublication=2024&status=SUBMITTED&summary=true
```

## Migration Notes

When deploying:
1. The database schema will automatically update with new columns
2. Default values will be set for existing records (SUBMITTED status)
3. Timestamps will be set to current time for existing records
4. Indexes will be created for performance optimization

## API Endpoints Comparison

| Endpoint | Journal | Proceedings | Status |
|----------|---------|-------------|--------|
| Create | ✓ | ✓ | Implemented |
| Update | ✓ | ✓ | Implemented |
| Get One | ✓ | ✓ | Implemented |
| List All | ✓ | ✓ | Implemented |
| User Proceedings | ✓ | ✓ | Implemented |
| Status Management | ✓ | ✓ | Implemented |
| Submit for Review | ✓ | ✓ | Implemented |
| Approve | ✓ | ✓ | Implemented |
| Reject | ✓ | ✓ | Implemented |
| Export to Excel | ✓ | - | Not applicable |
| Approval Timeline | ✓ | - | Future enhancement |

## Files Created
- `ProceedingsStatus.java` - Status enum
- `ConferenceProceedingsListItemDto.java` - List DTO
- `ProceedingsDecisionRequest.java` - Decision request DTO
- `ProceedingsStatusUpdateRequest.java` - Status update DTO

## Files Modified
- `ConferenceProceedings.java` - Added status, user, timestamps
- `ConferenceProceedingsRepository.java` - Added query methods
- `ConferenceProceedingsService.java` - Added full service logic
- `ConferenceProceedingsController.java` - Added all endpoints
- `schema.sql` - Added database columns and indexes

## Next Steps (Optional Enhancements)

1. **Export to Excel**: Create `ConferenceProceedingsExcelExportService` similar to journals
2. **Approval Timeline**: Create approval audit table with action history
3. **Search Optimization**: Add pagination support with Page<> return types
4. **Unit Calculation**: Integrate unit calculation for proceedings
5. **Attachment Support**: Add file attachment management

