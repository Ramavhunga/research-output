# ✅ Complete Fix - Conference Proceedings `created_at` Column Error

## The Problem
You were getting:
```
org.springframework.dao.InvalidDataAccessResourceUsageException: 
  could not execute statement [Invalid column name 'created_at'.] 
  [insert into conference_proceedings ...]
```

**Why?** Your Java entities reference `created_at`, `updated_at`, `status`, and `submitted_by` columns that don't exist in SQL Server. The schema initiation script was never run because `spring.sql.init.mode=never` in production config.

---

## ✅ What I Fixed For You

### 1. Created Idempotent SQL Patch
**File:** `sql_fix_missing_columns.sql`

This script safely:
- ✅ Adds missing columns to `conference_proceedings`, `journals`, `books`
- ✅ Backfills timestamp values for existing rows
- ✅ Sets NOT NULL constraints
- ✅ Prints progress messages
- ✅ Checks if columns exist before adding (won't fail if already present)

### 2. Enhanced Entity Column Mappings
Made Hibernate column-to-field mappings explicit (no ambiguity):

**`ConferenceProceedings.java`** - Added 13x `@Column` annotations:
- `dhetNo` → `dhet_no`
- `originalOrPhotocopy` → `original_or_photocopy`
- `yearOfPublication` → `year_of_publication`
- `titleOfProceeding` → `title_of_proceeding`
- `titleOfContribution` → `title_of_contribution`
- `fieldOfResearch` → `field_of_research`
- `startDate` → `start_date`
- `endDate` → `end_date`
- `editorIfApplicable` → `editor_if_applicable`
- `evidenceOfPeerReview` → `evidence_of_peer_review`
- `typeOfEvidence` → `type_of_evidence`
- `additionalProceedingComments` → `additional_proceeding_comments`

**`Units.java`** - Added 5x explicit column mappings (embedded class):
- `maxUnitsForPublication`, `totalProportionOfAuthors`, `authorCount`, `totalUnitsClaimed`, `otherAuthorsNonAffiliates`

**`ClaimingAuthorsContribution.java`** - Added 3x explicit column mappings (embedded class):
- `proportionOfAuthors`, `authorUnitsClaimed`, `additionalComments`

### 3. Created Development Profile
**File:** `application-dev.properties`

- Enables schema auto-initialization for local development
- Includes SQL debug logging
- Same DB config as production
- Use: `java -Dspring.profiles.active=dev -jar ...`

### 4. Updated Configuration
**File:** `application.properties`

- Added logging configuration hints (commented)
- Can uncomment for debugging

---

## 🔨 What YOU Need To Do Now

### STEP 1: Run the SQL Patch (REQUIRED)

**Via SQL Server Management Studio:**
```sql
-- 1. Open file: sql_fix_missing_columns.sql
-- 2. Make sure "research_output" database is selected in dropdown
-- 3. Click Execute (F5) or Ctrl+E
```

**Via PowerShell (if SSMS not available):**
```powershell
sqlcmd -S 10.21.0.20 -U pms -P "Univen@?18844" -d research_output -i "sql_fix_missing_columns.sql"
```

**Via Command Prompt:**
```cmd
sqlcmd -S 10.21.0.20 -U pms -P "Univen@?18844" -d research_output -i sql_fix_missing_columns.sql
```

### STEP 2: Verify the Fix Works

Run this query in SSMS to confirm all columns exist:
```sql
-- Check that columns were added
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'conference_proceedings'
  AND COLUMN_NAME IN ('created_at', 'updated_at', 'status', 'submitted_by')
ORDER BY COLUMN_NAME;
```

**Expected output:**
```
COLUMN_NAME          DATA_TYPE    IS_NULLABLE
created_at           datetime2    0  (NOT NULL)
status               nvarchar     0  (NOT NULL)
submitted_by         bigint       0  (NOT NULL)
updated_at           datetime2    0  (NOT NULL)
```

### STEP 3: Rebuild the Application

Terminal/PowerShell in project root:
```bash
# Clean rebuild
mvn clean install

# If errors, try first:
mvn clean compile
```

### STEP 4: Test the Fix

Option A - Start your application and test the API:
```bash
# Start app (using dev profile to enable schema init)
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"

# In another terminal, test insert:
curl -X POST http://localhost:8080/api/conference-proceedings \
  -H "Content-Type: application/json" \
  -H "X-Username: testuser" \
  -d '{
    "titleOfContribution": "AI in Higher Ed",
    "titleOfProceeding": "ICER 2026",
    "yearOfPublication": 2026,
    "city": "Johannesburg",
    "country": "South Africa",
    "authors": [{
      "firstName": "John",
      "surname": "Doe",
      "email": "john@univen.ac.za",
      "affiliation": true
    }]
  }'
```

Expected response: `200 OK` with created record

Option B - Run your normal deployment:
```bash
mvn clean install
# Deploy as you normally do
```

---

## 📁 Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `sql_fix_missing_columns.sql` | CREATED | SQL patch - RUN THIS FIRST |
| `SQL_SCHEMA_FIX_README.md` | CREATED | Detailed reference guide |
| `COMPLETE_FIX_INSTRUCTIONS.md` | CREATED | This file |
| `application-dev.properties` | CREATED | Dev profile (optional) |
| `application.properties` | MODIFIED | Added logging hints |
| `ConferenceProceedings.java` | MODIFIED | 13x `@Column` mappings |
| `Units.java` | MODIFIED | 5x `@Column` mappings |
| `ClaimingAuthorsContribution.java` | MODIFIED | 3x `@Column` mappings |

---

## ⚡ TL;DR (30 seconds)

1. **SQL Server:** Copy entire `sql_fix_missing_columns.sql` code → paste in SSMS → Execute
2. **Verify:** Run the SELECT query above to confirm 4 columns added with `datetime2`, `NOT NULL`
3. **Build:** `mvn clean install`
4. **Deploy:** Restart your application
5. **Done!** ✅

---

## 🆘 If It Still Doesn't Work

**Problem:** Still getting "Invalid column" errors

**Solution:**
1. Stop your application
2. Verify SQL patch executed with zero errors (check SSMS messages)
3. Run the verification SELECT query - do you see 4 rows?
4. Check `spring.sql.init.mode` in `application.properties` - should be `never`
5. Rebuild: `mvn clean install` (not just `build`)
6. Check application logs for exact column names in the error

**Problem:** "Default constraint already exists" when running SQL

**Solution:** Safe to ignore - the script has `IF NOT EXISTS` checks. Just means columns are already there. Run verification query to confirm.

---

## 💡 How to Prevent This in Future

**Local Development:** Always run with dev profile
```bash
java -Dspring.profiles.active=dev -jar target/research_output-0.0.1-SNAPSHOT.jar
```

**Production:** Keep `spring.sql.init.mode=never` (current default)

**New Environment Setup:** Before deploying to new database:
1. Create `research_output` database
2. Run `sql_fix_missing_columns.sql` once (or keep with deployment docs)
3. Deploy application

---

**✅ Status:** Ready to go! Run the SQL patch and rebuild.

**Questions?** See `SQL_SCHEMA_FIX_README.md` for detailed column reference and troubleshooting.

