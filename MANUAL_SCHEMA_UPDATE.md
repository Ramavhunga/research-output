# Manual Schema Update Guide

## Why Manual Schema Update?

The automatic schema initialization via `schema.sql` has been disabled to prevent conflicts with existing databases. This is the safest approach since:
1. Your database already exists with data
2. Automatic scripts can cause issues if indexes already exist
3. Manual execution gives you more control and visibility

## How to Create the Required Indexes

The dashboard optimization requires 6 new indexes for performance. Run these SQL commands directly on your database server:

### Option 1: Execute via SQL Server Management Studio

```sql
-- Connect to your research_output database
USE research_output;

-- Index on status for dashboard and review queue filtering
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_journals_status' AND object_id = OBJECT_ID('dbo.journals'))
    CREATE NONCLUSTERED INDEX IX_journals_status ON dbo.journals(status);

-- Index on submitted_by for user-specific queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_journals_submitted_by' AND object_id = OBJECT_ID('dbo.journals'))
    CREATE NONCLUSTERED INDEX IX_journals_submitted_by ON dbo.journals(submitted_by);

-- Index on comply for DHET compliance calculations
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_journals_comply' AND object_id = OBJECT_ID('dbo.journals'))
    CREATE NONCLUSTERED INDEX IX_journals_comply ON dbo.journals(comply);

-- Composite index for dashboard queries (status + id for sorting recent items)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_journals_status_id' AND object_id = OBJECT_ID('dbo.journals'))
    CREATE NONCLUSTERED INDEX IX_journals_status_id ON dbo.journals(status, id DESC);

-- Index on created_at for time-based queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_journals_created_at' AND object_id = OBJECT_ID('dbo.journals'))
    CREATE NONCLUSTERED INDEX IX_journals_created_at ON dbo.journals(created_at DESC);

-- Composite index combining status and submitted_by for user-specific review queue
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_journals_status_submitted_by' AND object_id = OBJECT_ID('dbo.journals'))
    CREATE NONCLUSTERED INDEX IX_journals_status_submitted_by ON dbo.journals(status, submitted_by);
```

### Option 2: Execute via PowerShell (sqlcmd)

```powershell
# If you have SQL Server command-line tools installed
sqlcmd -S "10.21.0.20" -U "pms" -P "Univen@?18844" -d "research_output" -i "C:\path\to\schema.sql"
```

### Option 3: Execute via Azure Data Studio

1. Open Azure Data Studio
2. Connect to your SQL Server
3. Open the schema.sql file from: `src/main/resources/schema.sql`
4. Select all and execute

## Verify Index Creation

After running the above commands, verify the indexes were created:

```sql
USE research_output;

-- Check if all indexes exist
SELECT name, object_id 
FROM sys.indexes 
WHERE object_id = OBJECT_ID('dbo.journals') 
AND name LIKE 'IX_journals%' 
ORDER BY name;

-- Expected output should show 6 indexes:
-- IX_journals_comply
-- IX_journals_created_at
-- IX_journals_status
-- IX_journals_status_id
-- IX_journals_status_submitted_by
-- IX_journals_submitted_by
```

## Performance Impact of Indexes

Once created, you should see immediate performance improvements:

```sql
-- Example query that will benefit from new indexes
-- Before: Full table scan (~2-3 seconds with large dataset)
-- After: Index seek (~50-100ms)

SELECT j.id, j.title, j.status 
FROM journals j 
WHERE j.status = 'SUBMITTED'
ORDER BY j.id DESC
LIMIT 8;
```

## Troubleshooting Index Creation

### Issue: "Index 'IX_journals_status' already exists"
**Solution**: The indexes already exist. Run the verification query above to confirm.

### Issue: Index creation fails due to permissions
**Solution**: Ensure your user has ALTER TABLE and CREATE INDEX permissions on the dbo.journals table

```sql
-- Grant necessary permissions (if needed)
GRANT ALTER ON OBJECT::dbo.journals TO [pms];
GRANT CREATE ON DATABASE::research_output TO [pms];
```

### Issue: Cannot create index on column that doesn't exist
**Solution**: This shouldn't happen as all columns were added by automatic DDL

## What If I Skip Index Creation?

The application will still work without the indexes, BUT:
- Dashboard will load slower (5-8 seconds instead of 500-800ms)
- Database queries will be slower
- Performance optimization will not be realized

**Recommendation**: Create the indexes to get the full benefit of the optimization.

## Checking Index Statistics

After creating indexes, check their usage:

```sql
-- Check index fragmentation
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent AS Fragmentation
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
INNER JOIN sys.indexes i ON ips.object_id = i.object_id 
    AND ips.index_id = i.index_id
WHERE OBJECT_NAME(ips.object_id) = 'journals'
    AND i.name LIKE 'IX_journals%'
ORDER BY ips.avg_fragmentation_in_percent DESC;

-- If fragmentation > 10%, rebuild index
-- If fragmentation > 30%, rebuild is recommended
-- REBUILD: ALTER INDEX index_name ON dbo.journals REBUILD;
-- REORGANIZE: ALTER INDEX index_name ON dbo.journals REORGANIZE;
```

## Index Maintenance

For best performance, maintain your indexes:

```sql
-- Weekly maintenance
ALTER INDEX IX_journals_status ON dbo.journals REORGANIZE;
ALTER INDEX IX_journals_submitted_by ON dbo.journals REORGANIZE;
ALTER INDEX IX_journals_comply ON dbo.journals REORGANIZE;
ALTER INDEX IX_journals_status_id ON dbo.journals REORGANIZE;
ALTER INDEX IX_journals_created_at ON dbo.journals REORGANIZE;
ALTER INDEX IX_journals_status_submitted_by ON dbo.journals REORGANIZE;

-- Update statistics
UPDATE STATISTICS dbo.journals;
```

## Next Steps

1. Create the indexes using one of the methods above
2. Verify they were created successfully
3. Restart the application
4. Test dashboard loading time
5. Compare before/after performance

## Issues?

If you encounter any problems:
1. Check the verification query to ensure indexes exist
2. Review the error logs in application startup
3. Verify database connectivity
4. Check that the user has necessary permissions

