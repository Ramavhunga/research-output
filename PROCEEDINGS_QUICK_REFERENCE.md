# Quick Reference: Saved Proceedings Functionality

## Feature Overview
The "Return Saved Proceedings" functionality allows researchers to save conference proceedings as drafts, retrieve them later, submit for review, and track approval status - just like the Journal system.

## API Quick Reference

### 1. **Save a New Proceedings**
```
POST /api/conference-proceedings
Headers: 
  Content-Type: application/json
  X-Username: researcher@example.com

Body: {
  "titleOfContribution": "Machine Learning Applications",
  "titleOfProceeding": "IEEE International Conference",
  "publisher": "IEEE",
  "yearOfPublication": 2024,
  "issn": "1234-5678",
  "isbn": "978-3-16-148410-0",
  "authors": [
    {
      "firstName": "John",
      "surname": "Smith",
      "email": "john@example.com",
      "affiliation": true,
      "universityAffiliations": [
        {
          "universityName": "University of Example",
          "facultyId": 1
        }
      ]
    }
  ]
}
```

### 2. **Retrieve Saved Proceedings (Current User)**
```
GET /api/conference-proceedings?mine=true
Headers: X-Username: researcher@example.com
```

**Response:**
```json
[
  {
    "id": 1,
    "dhetNo": "CP0001",
    "yearOfPublication": 2024,
    "status": "SUBMITTED",
    "titleOfContribution": "Machine Learning Applications",
    "publisher": "IEEE",
    "isbn": "978-3-16-148410-0",
    "submittedBy": {
      "username": "researcher@example.com"
    },
    "updatedAt": "2024-06-10T14:30:00"
  }
]
```

### 3. **Get Summary View (Lightweight)**
```
GET /api/conference-proceedings?mine=true&summary=true
Headers: X-Username: researcher@example.com
```

### 4. **Submit Proceedings for Review**
```
POST /api/conference-proceedings/1/submit
Headers: X-Username: researcher@example.com
Body: {
  "comments": "Please review this submission"
}
```

### 5. **Approve Proceedings (Reviewer Level 1)**
```
POST /api/conference-proceedings/1/approve
Headers: X-Username: reviewer@example.com
Body: {
  "comments": "Approved for Level 2 review. Well-structured paper."
}
```

### 6. **Approve Proceedings (Reviewer Level 2)**
```
POST /api/conference-proceedings/2/approve
Headers: X-Username: lvl2reviewer@example.com
Body: {
  "comments": "Excellent work. Ready for posting."
}
```

### 7. **Reject Proceedings**
```
POST /api/conference-proceedings/1/reject
Headers: X-Username: reviewer@example.com
Body: {
  "comments": "Requires significant revisions. Please address feedback."
}
```

### 8. **Update Proceedings**
```
PUT /api/conference-proceedings/1
Headers: 
  Content-Type: application/json
  X-Username: researcher@example.com
Body: {
  "titleOfContribution": "Updated Title",
  "publisher": "IEEE",
  ...
}
```

### 9. **Check if Proceedings Already Exists**
```
GET /api/conference-proceedings/exists?titleOfContribution=AI&issn=1234-5678
```

### 10. **Search Proceedings with Filters**
```
GET /api/conference-proceedings?yearOfPublication=2024&status=UNDER_REVIEW_L1&summary=true
```

### 11. **Delete Proceedings**
```
DELETE /api/conference-proceedings/1
Headers: X-Username: researcher@example.com
```

## Status Workflow

```
DRAFT
  ↓
SUBMITTED
  ↓
UNDER_REVIEW_L1 → REJECTED_L1 → UNDER_REVIEW_L1 (resubmit)
  ↓
UNDER_REVIEW_L2 → REJECTED_L2 → UNDER_REVIEW_L1 (resubmit)
  ↓
READY_FOR_POSTING (Final - Locked)
```

## Required Roles

| Action | Required Role |
|--------|---------------|
| Create/Save | Researcher (Any logged-in user) |
| Submit | Researcher who created it |
| Approve (L1) | REVIEWER_LEVEL_1, ADMIN |
| Approve (L2) | REVIEWER_LEVEL_2, ADMIN |
| Reject (L1) | REVIEWER_LEVEL_1, ADMIN |
| Reject (L2) | REVIEWER_LEVEL_2, ADMIN |
| Edit | Owner or reviewer at current level, or ADMIN |

## Key Differences from Journals

| Feature | Journal | Proceedings |
|---------|---------|------------|
| Core Purpose | Article publication tracking | Conference presentation tracking |
| Status Workflow | Similar multi-level approval | Same multi-level approval |
| User Management | Yes - submittedBy | Yes - submittedBy |
| Excel Export | Yes | Future enhancement |
| Approval Timeline | Yes with audit table | Future enhancement |
| Unique Identifier | Journal Title + ISSN | Contribution Title + ISBN/ISSN |

## Common Scenarios

### Scenario 1: Save and Submit Later
1. POST `/api/conference-proceedings` with basic info
2. Later, PUT `/api/conference-proceedings/1` to update
3. Finally, POST `/api/conference-proceedings/1/submit` to submit

### Scenario 2: Review Workflow
1. Researcher submits proceedings
2. Level 1 reviewer approves (moves to L2)
3. Level 2 reviewer approves (marks as READY_FOR_POSTING)

### Scenario 3: Revision Required
1. Level 1 reviewer rejects with comments
2. Researcher receives REJECTED_L1 status
3. Researcher updates and resubmits
4. Back to UNDER_REVIEW_L1

## Database Performance

The implementation includes 4 performance indexes:
- Status filtering (quick review queue lookups)
- User-specific queries (fast "my proceedings" retrieval)
- Time-based sorting (recent submissions)
- Combined status+user queries (complex filtering)

## Error Handling

### Validation Errors
- Missing author information
- Missing affiliated author
- Duplicate title+ISBN combination
- Invalid status transitions

### Authorization Errors
- Researcher trying to approve proceedings
- Non-owner trying to edit proceedings
- Reviewer at wrong level trying to take action

### Status Errors
- Invalid status transition (e.g., READY_FOR_POSTING → SUBMITTED)
- Attempting to edit locked proceedings
- Attempting to submit already published proceedings

## Testing Commands

### Quick Test - Create and Retrieve
```bash
# 1. Create
curl -X POST http://localhost:8080/api/conference-proceedings \
  -H "Content-Type: application/json" \
  -H "X-Username: testuser" \
  -d '{"titleOfContribution":"Test","publisher":"Test","authors":[{"firstName":"John","surname":"Doe","email":"john@example.com","affiliation":true,"universityAffiliations":[{"universityName":"Test Uni","facultyId":1}]}]}'

# 2. List
curl -X GET http://localhost:8080/api/conference-proceedings?mine=true \
  -H "X-Username: testuser"

# 3. Submit
curl -X POST http://localhost:8080/api/conference-proceedings/1/submit \
  -H "Content-Type: application/json" \
  -H "X-Username: testuser" \
  -d '{"comments":"Ready for review"}'
```

## Notes

- Always include `X-Username` header in requests
- Comments are required for approve/reject operations
- At least one author and one affiliated author required
- Timestamps are automatically managed
- DHET number is auto-generated in format: CP0001, CP0002, etc.

