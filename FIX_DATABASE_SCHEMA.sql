-- ============================================================================
-- FIX DATABASE SCHEMA: Convert BIT columns to NVARCHAR/VARCHAR
-- Run this script directly against your SQL Server database
-- ============================================================================

-- Drop foreign keys that might reference these tables temporarily if needed
-- (This script is safe for existing data)

-- ============================================================================
-- FIX: journals TABLE
-- ============================================================================

-- 1. Fix 'comply' column (should be nvarchar(10), not bit)
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL
BEGIN
    -- Check if comply exists and is BIT type
    IF EXISTS (
        SELECT 1 FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID(N'dbo.journals')
          AND c.name = 'comply'
          AND t.name = 'bit'
    )
    BEGIN
        -- Create temporary column
        IF COL_LENGTH('dbo.journals', 'comply_temp') IS NULL
            ALTER TABLE dbo.journals ADD comply_temp nvarchar(10);

        -- Migrate data
        UPDATE dbo.journals
        SET comply_temp = CASE
            WHEN comply = 1 THEN 'Yes'
            WHEN comply = 0 THEN 'No'
            ELSE 'N/A'
        END;

        -- Drop old column and rename
        ALTER TABLE dbo.journals DROP COLUMN comply;
        EXEC sp_rename 'dbo.journals.comply_temp', 'comply', 'COLUMN';

        PRINT 'FIXED: journals.comply - converted from BIT to nvarchar(10)';
    END
    ELSE
    BEGIN
        PRINT 'INFO: journals.comply is already correct type';
    END
END;

-- ============================================================================
-- FIX: conference_proceedings TABLE (if it exists and has these issues)
-- ============================================================================

IF OBJECT_ID(N'dbo.conference_proceedings', N'U') IS NOT NULL
BEGIN
    -- Check if compliesWith60Rule/similar boolean columns exist as BIT
    -- Add additional_comments if missing
    IF COL_LENGTH('dbo.conference_proceedings', 'additional_comments') IS NULL
        ALTER TABLE dbo.conference_proceedings ADD additional_comments nvarchar(2000);

    PRINT 'INFO: conference_proceedings columns verified';
END;

-- ============================================================================
-- FIX: books TABLE (if it exists and has these issues)
-- ============================================================================

IF OBJECT_ID(N'dbo.books', N'U') IS NOT NULL
BEGIN
    -- Check if evidenceOfPeerReview exists as BIT when should be VARCHAR
    IF EXISTS (
        SELECT 1 FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID(N'dbo.books')
          AND c.name = 'evidence_of_peer_review'
          AND t.name = 'bit'
    )
    BEGIN
        -- Create temporary column
        IF COL_LENGTH('dbo.books', 'evidence_of_peer_review_temp') IS NULL
            ALTER TABLE dbo.books ADD evidence_of_peer_review_temp nvarchar(50);

        -- Migrate data
        UPDATE dbo.books
        SET evidence_of_peer_review_temp = CASE
            WHEN evidence_of_peer_review = 1 THEN 'Yes'
            WHEN evidence_of_peer_review = 0 THEN 'No'
            ELSE NULL
        END;

        -- Drop old column and rename
        ALTER TABLE dbo.books DROP COLUMN evidence_of_peer_review;
        EXEC sp_rename 'dbo.books.evidence_of_peer_review_temp', 'evidence_of_peer_review', 'COLUMN';

        PRINT 'FIXED: books.evidence_of_peer_review - converted from BIT to nvarchar(50)';
    END
    ELSE
    BEGIN
        PRINT 'INFO: books.evidence_of_peer_review is already correct type';
    END
END;

-- ============================================================================
-- Add missing columns if needed
-- ============================================================================

-- Add journal_additional_comments to journals if missing
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL
   AND COL_LENGTH('dbo.journals', 'journal_additional_comments') IS NULL
BEGIN
    ALTER TABLE dbo.journals ADD journal_additional_comments nvarchar(2000);
    PRINT 'ADDED: journals.journal_additional_comments';
END;

-- Add additional_comments to journals if missing
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL
   AND COL_LENGTH('dbo.journals', 'additional_comments') IS NULL
BEGIN
    ALTER TABLE dbo.journals ADD additional_comments nvarchar(2000);
    PRINT 'ADDED: journals.additional_comments';
END;

-- ============================================================================
-- Add indexes for performance
-- ============================================================================

IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_journals_comply' AND object_id = OBJECT_ID('dbo.journals'))
        CREATE NONCLUSTERED INDEX IX_journals_comply ON dbo.journals(comply);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_journals_status' AND object_id = OBJECT_ID('dbo.journals'))
        CREATE NONCLUSTERED INDEX IX_journals_status ON dbo.journals(status);

    PRINT 'VERIFIED: Indexes on journals table';
END;

-- ============================================================================
-- Verification
-- ============================================================================

PRINT '';
PRINT '===== SCHEMA VERIFICATION =====';

-- Check journals columns
SELECT 'journals' AS TableName, c.name AS ColumnName, t.name AS DataType
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID(N'dbo.journals')
  AND c.name IN ('comply', 'openaccess', 'dhet_accepted', 'journal_additional_comments', 'additional_comments')
ORDER BY c.name;

PRINT '';
PRINT 'Script execution completed. Review the output above for any FIXED items.';

