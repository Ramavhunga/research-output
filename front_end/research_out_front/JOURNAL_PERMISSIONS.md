# Journal Editing Permission Implementation

## Overview
This implementation adds role-based and status-based permission checks for journal editing in the ResearchOutFront system.

## Changes Made

### 1. New Permission Service
**File:** `src/app/services/journal-permission.service.ts`

A new service that manages all journal editing permissions with the following rules:

#### Permission Rules:
- **Requestor (Submitter):** Can edit journals only when status is REJECTED (REJECTED_L1, REJECTED_L2, or DRAFT)
- **Admin/Approvers:** Can edit journals at any time (roles: ADMIN, LEVEL_1_APPROVER, LEVEL_2_APPROVER, ADMINISTRATOR)
- **Locked Status:** No one can edit when status is READY_FOR_POSTING, READY, APPROVED, PUBLISHED, or ARCHIVED

#### Key Methods:
```typescript
canEditJournal(journal: Journal): { canEdit: boolean; reason: string }
  - Determines if current user can edit the journal
  - Returns permission status and explanation

getEditableStatusesForRequestor(): string[]
  - Returns statuses that allow requestor editing: ['REJECTED', 'REJECTED_L1', 'REJECTED_L2', 'DRAFT']

getLockedStatuses(): string[]
  - Returns locked statuses: ['READY_FOR_POSTING', 'READY', 'APPROVED', 'PUBLISHED', 'ARCHIVED']

getApproverRoles(): string[]
  - Returns approver role names
```

### 2. Updated Journal Component
**File:** `src/app/components/journal-component/journal-component.ts`

#### Changes:
- Injected `JournalPermissionService`
- Added `canEditJournal(journal: Journal)` method to check if current user can edit
- Added `editJournal(journal: Journal)` method to:
  - Verify permissions before allowing edit
  - Show notification if permission denied
  - Navigate to edit mode if permitted

#### New Methods:
```typescript
canEditJournal(journal: Journal): boolean
  - Used in template to enable/disable Edit button

editJournal(journal: Journal): void
  - Handles Edit button click
  - Checks permissions and navigates or shows error
```

### 3. Updated Journal Component Template
**File:** `src/app/components/journal-component/journal-component.html`

#### Changes:
- Added new "Edit" button next to "View" button
- Button is disabled when user doesn't have permission
- Tooltip shows reason when disabled
- Button uses `editJournal()` method for navigation

```html
<button type="button" 
        class="btn btn-outline-info btn-sm ms-2"
        (click)="editJournal(output)"
        [disabled]="!canEditJournal(output)"
        [title]="!canEditJournal(output) ? 'You do not have permission to edit this journal' : 'Edit this journal'">
  <i class="ti ti-edit me-1"></i> Edit
</button>
```

### 4. Updated Journal Detail Component
**File:** `src/app/components/journal-detail-component/journal-detail-component.ts`

#### Changes:
- Injected `JournalPermissionService`
- Updated `ngOnInit()` to:
  - Check edit permissions when entering non-review mode
  - Force read-only mode if user lacks permission
  - Show informational alert if permission denied

#### Behavior:
- When user clicks Edit button in journal list, permission is checked
- If permission denied, form auto-disables and shows read-only message
- Users with permission can edit and save changes

## User Roles

The system supports the following roles (case-insensitive):
- **ADMIN:** Can edit all journals at any time
- **LEVEL_1_APPROVER:** Can edit all journals at any time
- **LEVEL_2_APPROVER:** Can edit all journals at any time
- **ADMINISTRATOR:** Can edit all journals at any time (alias for ADMIN)

Users without these roles are considered "Requestors" and can only edit their own rejected journals.

## Status Values

### Editable Statuses (Requestor):
- `DRAFT` - Initial status
- `REJECTED` - Generic rejected
- `REJECTED_L1` - Rejected by Level 1 Approver
- `REJECTED_L2` - Rejected by Level 2 Approver

### Locked Statuses (No Editing):
- `READY_FOR_POSTING` - Ready for posting (locked)
- `READY` - Alternative ready status (locked)
- `APPROVED` - Approved (locked)
- `PUBLISHED` - Published (locked)
- `ARCHIVED` - Archived (locked)

## Session Storage Structure

User information is stored in `sessionStorage['login']` with the following structure:

```json
{
  "user": {
    "username": "john.doe",
    "roles": ["LEVEL_1_APPROVER", "RESEARCHER"]
  }
}
```

## Journal Model Addition

The `Journal` interface already includes the `submittedBy` field:

```typescript
submittedBy?: {
  username?: string;
}
```

This is used to track who originally submitted the journal (the requestor).

## Testing the Implementation

### Test Case 1: Requestor Editing Rejected Journal
1. User logs in as "john.doe" (no approver roles)
2. Navigate to Journal list
3. Find a journal with status "REJECTED_L1" submitted by john.doe
4. Edit button should be enabled
5. Click Edit to modify and save

### Test Case 2: Requestor Cannot Edit Approved Journal
1. User logs in as "john.doe" (no approver roles)
2. Navigate to Journal list
3. Find a journal with status "APPROVED" submitted by john.doe
4. Edit button should be disabled with message
5. View button works to see read-only version

### Test Case 3: Admin Can Always Edit
1. User logs in as admin (role: ADMIN)
2. Navigate to Journal list
3. Any journal should have Edit button enabled
4. Can edit and save regardless of status (unless locked)

### Test Case 4: Cannot Edit When Status is Locked
1. User logs in as admin
2. Find a journal with status "READY_FOR_POSTING"
3. Click Edit button
4. Form should be read-only with notification
5. Cannot save changes

## Error Handling

Permission denied scenarios:
1. **Not Logged In:** "You must be logged in to edit journals."
2. **Locked Status:** "Journal cannot be edited when status is '[STATUS]'. It is locked for editing."
3. **Rejected Non-Requestor:** "As the requestor, you can only edit rejected journals. Current status is '[STATUS]'."
4. **No Permission:** "You do not have permission to edit this journal."

Each scenario shows a SweetAlert2 notification explaining why editing is not allowed.

## Future Enhancements

1. **Audit Logging:** Log all edit attempts (successful and failed)
2. **Permission Caching:** Cache user roles to reduce sessionStorage reads
3. **Role-Based Admin Panel:** Allow administrators to modify permissions
4. **Email Notifications:** Notify relevant parties when journals are edited
5. **Version History:** Track journal modifications and maintain edit history
6. **Batch Operations:** Allow bulk editing by admins

## Files Modified

1. `src/app/services/journal-permission.service.ts` - NEW
2. `src/app/components/journal-component/journal-component.ts` - UPDATED
3. `src/app/components/journal-component/journal-component.html` - UPDATED
4. `src/app/components/journal-detail-component/journal-detail-component.ts` - UPDATED

## References

- User roles stored in: `sessionStorage['login'].user.roles`
- Journal requestor: `journal.submittedBy.username`
- Journal status: `journal.status`
- Permission service: `JournalPermissionService`

