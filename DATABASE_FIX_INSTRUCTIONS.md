# Database Schema Fix & Testing Guide

## Problem Summary
The error occurs because:
1. **Database Schema Mismatch**: Your SQL Server database has columns defined as `BIT` type when they should be `NVARCHAR` or `VARCHAR`
2. **Type Conversion Failure**: When Hibernate tries to insert string values like "Yes" into a BIT column, SQL Server throws a conversion error
3. **Solution**: Convert BIT columns to proper string types and ensure Java entities normalize payloads

## Step-by-Step Fix

### Step 1: Run Database Schema Fix Script
Execute the SQL script against your research_output database:

1. Open SQL Server Management Studio (SSMS)
2. Connect to your database: `research_output`
3. Open a new query window
4. Copy and paste the contents of: `FIX_DATABASE_SCHEMA.sql`
5. Execute the script (F5)
6. Review the output messages to confirm all fixes were applied

**Expected Output:**
```
FIXED: journals.comply - converted from BIT to nvarchar(10)
INFO: conference_proceedings columns verified
FIXED: books.evidence_of_peer_review - converted from BIT to nvarchar(50)
ADDED: journals.journal_additional_comments
ADDED: journals.additional_comments
VERIFIED: Indexes on journals table

===== SCHEMA VERIFICATION =====
TableName | ColumnName | DataType
journals  | comply | nvarchar
journals  | openaccess | bit
journals  | dhet_accepted | bit
```

### Step 2: Verify Java Configuration

All the following have been updated:

✅ **Journal.java** - Has `@JsonSetter("comply")` method that normalizes "Yes"/"No"/"N/A" strings
✅ **ConferenceProceedings.java** - Has `@JsonSetter("compliesWith60Rule")` for boolean normalization
✅ **Book.java** - Has `@JsonSetter("evidenceOfPeerReview")` for string normalization
✅ **application.properties** - Schema initialization disabled (set to `never`)
✅ **DatabaseCompatibilityRepairRunner** - Disabled (startup repair removed)

### Step 3: Rebuild and Deploy

```bash
cd C:\Users\Muthuhadini.Ramavhun\IdeaProjects\research_output
mvn clean package -DskipTests
```

You should see: `[INFO] BUILD SUCCESS`

### Step 4: Test Journal Save

**Prerequisites:**
- Ensure your user has a valid role in the system
- Journal should have basic required fields filled

**Test Case:**

1. Start the application
2. Log in as a user with journal submission privileges
3. Create/edit a Journal with:
   - Title: "Test Journal"
   - Journal Title: "Test Journal Name"
   - Year: "2024"
   - Comply: "Yes" (or "No" or "N/A")
   - Publisher: "Test Publisher"

4. Save the journal

**Expected Result:**
- No database conversion errors
- Journal saves successfully with status "SUBMITTED"

### Step 5: Test Conference Proceedings Save

**Test Case:**

1. Create/edit a Conference Proceeding with:
   - Title of Proceeding: "Test Conference"
   - Title of Contribution: "Test Paper"
   - Year of Publication: 2024
   - Complies 60 Rule: true/false
   - Evidence of Peer Review: true/false

2. Save the conference proceeding

**Expected Result:**
- No database conversion errors
- Proceeding saves successfully

### Step 6: Test Book Save

**Test Case:**

1. Create/edit a Book with:
   - Title of Book: "Test Book"
   - ISBN: "123456789"
   - Year of Publication: 2024
   - Evidence of Peer Review: "Yes" (or "No")

2. Save the book

**Expected Result:**
- No database conversion errors
- Book saves successfully

## How the Fix Works

### Database Level
- Columns that store "Yes"/"No"/"N/A" are now NVARCHAR(10)
- Boolean columns (openaccess, dhet_accepted) remain as BIT
- SQL Server can now properly receive string values without conversion errors

### Java Application Level
When a JSON payload comes in with mixed data types:

```json
{
  "comply": "Yes",
  "openaccess": true,
  "dhetAccepted": "No"
}
```

The `@JsonSetter` methods intercept and normalize:
1. `comply` → stays as string "Yes"
2. `openaccess` → converted to Boolean.TRUE
3. `dhetAccepted` → converted to Boolean.FALSE

This ensures the database receives the correct data types.

## Troubleshooting

### Error: "Script execution failed"
- Ensure you're running against the correct database (research_output)
- Check that your SQL Server user has permissions to ALTER TABLE
- If column doesn't exist, the script will skip it

### Error: "Could not parse the query"
- Ensure the schema.sql file is not being executed (we've disabled it)
- Check `application.properties` - should have `spring.sql.init.mode=never`

### Still Getting Conversion Errors
1. Verify the database schema fix was applied:
   ```sql
   SELECT name, TYPE_NAME(user_type_id) as DataType
   FROM sys.columns
   WHERE object_id = OBJECT_ID('dbo.journals')
   AND name IN ('comply', 'openaccess', 'dhet_accepted');
   ```

2. Restart the Spring application after database changes

3. Check that the @JsonSetter methods are present in entities by viewing the compiled classes

## Summary of Changes Made

### Configuration Files
- `application.properties`: Disabled SQL schema initialization

### Entity Classes (Updated)
- `Journal.java`: Already has proper @JsonSetter normalizers
- `ConferenceProceedings.java`: Added @JsonSetter for compliesWith60Rule
- `Book.java`: Added @JsonSetter for evidenceOfPeerReview

### Runner Classes (Disabled)
- `DatabaseCompatibilityRepairRunner.java`: Disabled @Component annotation

### Database Script (To Execute Manually)
- `FIX_DATABASE_SCHEMA.sql`: Converts BIT columns to proper types

## Build Status
✅ All Java code compiles successfully
✅ No compilation errors
✅ Ready to test after database schema fix

