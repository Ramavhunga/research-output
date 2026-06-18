# Conference Proceedings & Research Output - SQL Schema Fix

## Problem
Your database is missing audit timestamp columns (`created_at`, `updated_at`) and workflow columns (`status`, `submitted_by`) that your Java entities require.

**Why?** - Your `application.properties` has `spring.sql.init.mode=never` (correct for production) 
- This prevents automatic schema initialization from `schema.sql`
- Your entities expect these columns but they weren't added manually to the database

## Solution: Apply the SQL Patch

### Step 1: Run the SQL Patch
Execute the SQL file against your `research_output` database:

```sql
-- In SQL Server Management Studio:
-- 1. Open: sql_fix_missing_columns.sql
-- 2. Select your research_output database: USE research_output;
-- 3. Run the script (F5 or Execute)
```

Or via PowerShell:
```powershell
sqlcmd -S 10.21.0.20 -U pms -P "Univen@?18844" -d research_output -i "C:\Users\Muthuhadini.Ramavhun\IdeaProjects\research_output\sql_fix_missing_columns.sql"
```

### Step 2: Verify the Fix
After running the patch, verify all columns exist:

```sql
-- Check conference_proceedings
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'conference_proceedings'
  AND COLUMN_NAME IN ('created_at', 'updated_at', 'status', 'submitted_by');

-- Check journals
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'journals'
  AND COLUMN_NAME IN ('created_at', 'updated_at', 'status', 'submitted_by');

-- Check books
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'books'
  AND COLUMN_NAME IN ('created_at', 'updated_at');
```

Expected output for each: `datetime2`, `NOT NULL` (is_nullable = 0)

### Step 3: Test the Application
Restart your Spring Boot application and try creating a conference proceedings:

```bash
# In project root
mvn clean install
java -jar target/research_output-0.0.1-SNAPSHOT.jar
```

Try POST request:
```bash
curl -X POST http://localhost:8080/api/conference-proceedings \
  -H "Content-Type: application/json" \
  -H "X-Username: testuser" \
  -d '{
    "titleOfContribution": "Test Paper",
    "titleOfProceeding": "Test Conference",
    "yearOfPublication": 2026,
    "city": "Johannesburg",
    "country": "South Africa",
    "status": "SUBMITTED",
    "authors": [
      {
        "firstName": "John",
        "surname": "Doe",
        "email": "john@example.com",
        "affiliation": true
      }
    ]
  }'
```

## Column Mapping Reference

### ConferenceProceedings Entity → DB Table
The following Java fields map to snake_case column names:

| Entity Field | DB Column | Type | Null |
|---|---|---|---|
| createdAt | created_at | datetime2 | NOT NULL |
| updatedAt | updated_at | datetime2 | NOT NULL |
| status | status | nvarchar(50) | NOT NULL |
| submittedBy | submitted_by | bigint | NOT NULL |
| dhetNo | dhet_no | nvarchar(255) | NULL |
| titleOfContribution | title_of_contribution | nvarchar(1000) | NULL |
| yearOfPublication | year_of_publication | int | NULL |
| (embedded) Units.authorCount | author_count | int | NULL |
| (embedded) Units.maxUnitsForPublication | max_units_for_publication | float | NULL |
| (embedded) Units.totalProportionOfAuthors | total_proportion_of_authors | float | NULL |
| (embedded) Units.totalUnitsClaimed | total_units_claimed | float | NULL |
| (embedded) Units.otherAuthorsNonAffiliates | other_authors_non_affiliates | int | NULL |
| (embedded) ClaimingAuthorsContribution.proportionOfAuthors | proportion_of_authors | float | NULL |
| (embedded) ClaimingAuthorsContribution.authorUnitsClaimed | author_units_claimed | float | NULL |
| (embedded) ClaimingAuthorsContribution.additionalComments | additional_comments | nvarchar(2000) | NULL |

## Debugging Tips

If you still see column errors after applying the patch:

1. **Enable SQL logging** in `application.properties`:
   ```properties
   logging.level.org.hibernate.SQL=DEBUG
   logging.level.org.hibernate.orm.jdbc.bind=TRACE
   ```
   Then restart and check console output for the exact SQL being generated.

2. **Clear Hibernate second-level cache**:
   ```java
   // Add to your application startup if using caching
   SessionFactory sf = emf.unwrap(SessionFactory.class);
   sf.getCache().evictAllRegions();
   ```

3. **Manual schema verification**:
   ```sql
   -- List all columns in conference_proceedings
   EXEC sp_help 'conference_proceedings';
   ```

## Future Prevention

To prevent this in development environments, you can create a dev profile:

**`application-dev.properties`**:
```properties
# Override only in dev: allow schema auto-initialization
spring.sql.init.mode=always
```

Then run with:
```bash
java -Dspring.profiles.active=dev -jar target/research_output-0.0.1-SNAPSHOT.jar
```

Keep `spring.sql.init.mode=never` in `application.properties` (default=production-safe).

---
**Last Updated:** June 15, 2026

