# Test Verification Checklist

After running the database fix script, use this checklist to verify everything works.

## Prerequisites
- [ ] `FIX_DATABASE_SCHEMA.sql` has been executed in SQL Server
- [ ] Application has been rebuilt with `mvn clean package -DskipTests`
- [ ] Application is restarted and fully loaded
- [ ] No errors visible in application startup logs

## Test 1: Journal Save with Comply Field

### Setup
- [ ] Logged in as a user with Journal submit role
- [ ] Navigate to Journal submission form

### Test Case
```
Title: "Test Journal With Comply"
Journal Title: "Test Journal Name"
Year: "2024"
Publisher: "Test Publisher"
Comply: "Yes"  [or "No" or "N/A"]
Status: (defaults to SUBMITTED)
```

### Expected Result
- [ ] No database error dialog
- [ ] Journal saves successfully
- [ ] Success message appears
- [ ] Journal appears in list with status "SUBMITTED"
- [ ] Comply field retained as "Yes"/"No"/"N/A"

### Verify in Database
```sql
SELECT TOP 1 id, title, comply, status, created_at 
FROM journals 
ORDER BY created_at DESC;
```
Should show: `comply` = 'Yes' (text, not numeric)

---

## Test 2: Journal Save with Boolean Fields

### Setup
- [ ] Same user with Journal role
- [ ] Journal form

### Test Case
```
Title: "Test Journal with Booleans"
Journal Title: "Boolean Test"
Year: "2024"
Publisher: "Test Pub"
Comply: "Yes"
OpenAccess: true
DHET Accepted: false
```

### Expected Result
- [ ] No conversion errors
- [ ] Journal saves successfully
- [ ] Fields are properly stored (openaccess as bit, comply as text)

### Verify in Database
```sql
SELECT id, comply, openaccess, dhet_accepted 
FROM journals 
WHERE title = 'Test Journal with Booleans';
```
Should show:
- `comply` = 'Yes' (nvarchar)
- `openaccess` = 1 or 0 (bit)
- `dhet_accepted` = 1 or 0 (bit)

---

## Test 3: Conference Proceedings Save

### Setup
- [ ] Logged in as user with Proceedings role
- [ ] Navigate to Conference Proceedings form

### Test Case
```
Title of Proceeding: "Test Conference 2024"
Title of Contribution: "My Research Paper"
Year of Publication: 2024
Complies 60 Rule: true
Evidence of Peer Review: false
```

### Expected Result
- [ ] No database conversion error
- [ ] Proceedings saves successfully
- [ ] Success message appears
- [ ] Status shows as "SUBMITTED"

### Verify in Database
```sql
SELECT TOP 1 id, title_of_proceeding, complies_60_rule, evidence_of_peer_review
FROM conference_proceedings
ORDER BY created_at DESC;
```

---

## Test 4: Book Save

### Setup
- [ ] Logged in as user with Books role
- [ ] Navigate to Book submission form

### Test Case
```
Title of Book: "Test Book 2024"
ISBN: "978-0-123456-78-9"
Year of Publication: 2024
Evidence of Peer Review: "Yes"
```

### Expected Result
- [ ] No database error
- [ ] Book saves successfully
- [ ] Success message appears
- [ ] Status shows as "SUBMITTED"

### Verify in Database
```sql
SELECT TOP 1 id, title_of_book, isbn, evidence_of_peer_review
FROM books
ORDER BY created_at DESC;
```

---

## Test 5: Field Type Conversion Scenarios

### Test Data Types in Journal Form

Test each variation to confirm normalization works:

| Input Value | Field | Expected Storage | ✓ Pass |
|-------------|-------|------------------|--------|
| "Yes" | comply | "Yes" | [ ] |
| "No" | comply | "No" | [ ] |
| "N/A" | comply | "N/A" | [ ] |
| "yes" | comply | "Yes" | [ ] |
| "no" | comply | "No" | [ ] |
| "Y" | comply | "Yes" | [ ] |
| "N" | comply | "No" | [ ] |
| true | openaccess | 1 (bit) | [ ] |
| false | openaccess | 0 (bit) | [ ] |
| "true" | openaccess | 1 (bit) | [ ] |
| "false" | openaccess | 0 (bit) | [ ] |
| 1 | dhetAccepted | 1 (bit) | [ ] |
| 0 | dhetAccepted | 0 (bit) | [ ] |

---

## Test 6: Update/Edit Operations

### Setup
- [ ] Journal from Test 1 is saved and visible in list
- [ ] Click Edit on that journal

### Test Case
- [ ] Change Comply: "Yes" → "No"
- [ ] Change OpenAccess: true → false
- [ ] Save changes

### Expected Result
- [ ] No conversion error
- [ ] Changes save successfully
- [ ] Values update in database

---

## Test 7: Batch Operations (if applicable)

### Setup
- [ ] Create 3-5 journals with different comply values
- [ ] Use bulk operations if available

### Expected Result
- [ ] All save without errors
- [ ] All values stored correctly in database

---

## Database Schema Verification

Run this query to verify your database structure is correct:

```sql
-- Check column types in journals table
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'journals'
    AND COLUMN_NAME IN (
        'comply',
        'openaccess', 
        'dhet_accepted',
        'journal_additional_comments',
        'additional_comments'
    )
ORDER BY COLUMN_NAME;
```

**Expected Output:**
```
COLUMN_NAME                    | DATA_TYPE  | MAX_LENGTH | NULLABLE
comply                         | nvarchar   | 10         | YES
openaccess                     | bit        | NULL       | YES
dhet_accepted                  | bit        | NULL       | YES
journal_additional_comments    | nvarchar   | 2000       | YES
additional_comments            | nvarchar   | 2000       | YES
```

---

## Troubleshooting During Testing

### Error: "Conversion failed when converting nvarchar to bit"
**Solution:** 
- The database fix script didn't run completely
- Re-run `FIX_DATABASE_SCHEMA.sql`
- Verify with schema check query above

### Error: "Column 'xyz' not found"
**Solution:**
- Missing columns were added by script
- Run script again to add missing columns
- Restart application

### Error: "Could not execute statement"
**Solution:**
- Check database connection in application.properties
- Verify database is accessible
- Check SQL Server credentials

### Field not saving with correct value
**Solution:**
- @JsonSetter method may not be triggered
- Check that Jackson is properly deserializing JSON
- Verify imports are correct in entity files

---

## Sign-Off

Once all tests pass:

- [ ] Test 1: Journal Save - PASSED
- [ ] Test 2: Boolean Fields - PASSED
- [ ] Test 3: Conference Proceedings - PASSED
- [ ] Test 4: Book Save - PASSED
- [ ] Test 5: Type Conversion - PASSED
- [ ] Test 6: Update Operations - PASSED
- [ ] Test 7: Batch Operations - PASSED
- [ ] Database Schema Verified - CORRECT

**Overall Status: READY FOR PRODUCTION** ✅

Date Tested: ________________
Tested By: ________________

