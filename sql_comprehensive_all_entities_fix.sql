-- ============================================================================
-- Comprehensive SQL Server Patch: All Entities (Conference, Journal, Book, etc)
-- Safe idempotent script - checks existence before making changes
-- Fixes all save failures across all research output types
-- ============================================================================

PRINT '=== Starting Comprehensive Schema Patch ===';
PRINT '';

-- ============================================================================
-- 1. USER TABLE - Auxiliary (required for foreign keys)
-- ============================================================================
PRINT 'Checking users table...';
IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
    PRINT '  ✗ WARNING: users table not found - FK constraints may fail';
END
ELSE
    PRINT '  ✓ users table exists';

-- ============================================================================
-- 2. CONFERENCE_PROCEEDINGS TABLE
-- ============================================================================
PRINT '';
PRINT 'Processing conference_proceedings table...';

IF OBJECT_ID(N'dbo.conference_proceedings', N'U') IS NOT NULL
BEGIN
    -- Core audit columns
    IF COL_LENGTH('dbo.conference_proceedings', 'created_at') IS NULL
    BEGIN
        ALTER TABLE dbo.conference_proceedings ADD created_at datetime2 NULL;
        PRINT '  ✓ Added created_at';
    END

    IF COL_LENGTH('dbo.conference_proceedings', 'updated_at') IS NULL
    BEGIN
        ALTER TABLE dbo.conference_proceedings ADD updated_at datetime2 NULL;
        PRINT '  ✓ Added updated_at';
    END

    IF COL_LENGTH('dbo.conference_proceedings', 'status') IS NULL
    BEGIN
        ALTER TABLE dbo.conference_proceedings ADD status nvarchar(50) NULL;
        PRINT '  ✓ Added status';
    END

    IF COL_LENGTH('dbo.conference_proceedings', 'submitted_by') IS NULL
    BEGIN
        ALTER TABLE dbo.conference_proceedings ADD submitted_by bigint NULL;
        PRINT '  ✓ Added submitted_by';
    END

    -- Embedded Units columns
    IF COL_LENGTH('dbo.conference_proceedings', 'max_units_for_publication') IS NULL
        ALTER TABLE dbo.conference_proceedings ADD max_units_for_publication float NULL;
    IF COL_LENGTH('dbo.conference_proceedings', 'total_proportion_of_authors') IS NULL
        ALTER TABLE dbo.conference_proceedings ADD total_proportion_of_authors float NULL;
    IF COL_LENGTH('dbo.conference_proceedings', 'author_count') IS NULL
        ALTER TABLE dbo.conference_proceedings ADD author_count int NULL;
    IF COL_LENGTH('dbo.conference_proceedings', 'total_units_claimed') IS NULL
        ALTER TABLE dbo.conference_proceedings ADD total_units_claimed float NULL;
    IF COL_LENGTH('dbo.conference_proceedings', 'other_authors_non_affiliates') IS NULL
        ALTER TABLE dbo.conference_proceedings ADD other_authors_non_affiliates int NULL;

    -- Embedded ClaimingAuthorsContribution columns
    IF COL_LENGTH('dbo.conference_proceedings', 'proportion_of_authors') IS NULL
        ALTER TABLE dbo.conference_proceedings ADD proportion_of_authors float NULL;
    IF COL_LENGTH('dbo.conference_proceedings', 'author_units_claimed') IS NULL
        ALTER TABLE dbo.conference_proceedings ADD author_units_claimed float NULL;
    IF COL_LENGTH('dbo.conference_proceedings', 'additional_comments') IS NULL
        ALTER TABLE dbo.conference_proceedings ADD additional_comments nvarchar(2000) NULL;

    -- Backfill timestamps
    UPDATE dbo.conference_proceedings
    SET created_at = ISNULL(created_at, SYSDATETIME()),
        updated_at = ISNULL(updated_at, SYSDATETIME())
    WHERE created_at IS NULL OR updated_at IS NULL;

    -- Enforce NOT NULL
    IF EXISTS(SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.conference_proceedings')
              AND name = 'created_at' AND is_nullable = 1)
        ALTER TABLE dbo.conference_proceedings ALTER COLUMN created_at datetime2 NOT NULL;

    IF EXISTS(SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.conference_proceedings')
              AND name = 'updated_at' AND is_nullable = 1)
        ALTER TABLE dbo.conference_proceedings ALTER COLUMN updated_at datetime2 NOT NULL;

    PRINT '  ✓ conference_proceedings configured';
END
ELSE
    PRINT '  ✗ conference_proceedings table not found';

-- ============================================================================
-- 3. JOURNALS TABLE
-- ============================================================================
PRINT '';
PRINT 'Processing journals table...';

IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL
BEGIN
    -- Core audit columns
    IF COL_LENGTH('dbo.journals', 'created_at') IS NULL
    BEGIN
        ALTER TABLE dbo.journals ADD created_at datetime2 NULL;
        PRINT '  ✓ Added created_at';
    END

    IF COL_LENGTH('dbo.journals', 'updated_at') IS NULL
    BEGIN
        ALTER TABLE dbo.journals ADD updated_at datetime2 NULL;
        PRINT '  ✓ Added updated_at';
    END

    IF COL_LENGTH('dbo.journals', 'status') IS NULL
    BEGIN
        ALTER TABLE dbo.journals ADD status nvarchar(50) NULL;
        PRINT '  ✓ Added status';
    END

    IF COL_LENGTH('dbo.journals', 'submitted_by') IS NULL
    BEGIN
        ALTER TABLE dbo.journals ADD submitted_by bigint NULL;
        PRINT '  ✓ Added submitted_by';
    END

    -- Publication fee columns
    IF COL_LENGTH('dbo.journals', 'publicationfeedescription') IS NULL
        ALTER TABLE dbo.journals ADD publicationfeedescription nvarchar(255) NULL;
    IF COL_LENGTH('dbo.journals', 'publishercurrency') IS NULL
        ALTER TABLE dbo.journals ADD publishercurrency nvarchar(100) NULL;
    IF COL_LENGTH('dbo.journals', 'totalpublicationfeepublishercurrency') IS NULL
        ALTER TABLE dbo.journals ADD totalpublicationfeepublishercurrency float NULL;
    IF COL_LENGTH('dbo.journals', 'publicationfeearticle') IS NULL
        ALTER TABLE dbo.journals ADD publicationfeearticle float NULL;
    IF COL_LENGTH('dbo.journals', 'authorscontributionfee') IS NULL
        ALTER TABLE dbo.journals ADD authorscontributionfee float NULL;
    IF COL_LENGTH('dbo.journals', 'authorscontributionfeezar') IS NULL
        ALTER TABLE dbo.journals ADD authorscontributionfeezar float NULL;

    -- Embedded Units columns
    IF COL_LENGTH('dbo.journals', 'max_units_for_publication') IS NULL
        ALTER TABLE dbo.journals ADD max_units_for_publication float NULL;
    IF COL_LENGTH('dbo.journals', 'total_proportion_of_authors') IS NULL
        ALTER TABLE dbo.journals ADD total_proportion_of_authors float NULL;
    IF COL_LENGTH('dbo.journals', 'author_count') IS NULL
        ALTER TABLE dbo.journals ADD author_count int NULL;
    IF COL_LENGTH('dbo.journals', 'total_units_claimed') IS NULL
        ALTER TABLE dbo.journals ADD total_units_claimed float NULL;
    IF COL_LENGTH('dbo.journals', 'other_authors_non_affiliates') IS NULL
        ALTER TABLE dbo.journals ADD other_authors_non_affiliates int NULL;

    -- Embedded ClaimingAuthorsContribution columns
    IF COL_LENGTH('dbo.journals', 'proportion_of_authors') IS NULL
        ALTER TABLE dbo.journals ADD proportion_of_authors float NULL;
    IF COL_LENGTH('dbo.journals', 'author_units_claimed') IS NULL
        ALTER TABLE dbo.journals ADD author_units_claimed float NULL;
    IF COL_LENGTH('dbo.journals', 'additional_comments') IS NULL
        ALTER TABLE dbo.journals ADD additional_comments nvarchar(2000) NULL;

    -- Backfill timestamps
    UPDATE dbo.journals
    SET created_at = ISNULL(created_at, SYSDATETIME()),
        updated_at = ISNULL(updated_at, SYSDATETIME())
    WHERE created_at IS NULL OR updated_at IS NULL;

    -- Enforce NOT NULL
    IF EXISTS(SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.journals')
              AND name = 'created_at' AND is_nullable = 1)
        ALTER TABLE dbo.journals ALTER COLUMN created_at datetime2 NOT NULL;

    IF EXISTS(SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.journals')
              AND name = 'updated_at' AND is_nullable = 1)
        ALTER TABLE dbo.journals ALTER COLUMN updated_at datetime2 NOT NULL;

    PRINT '  ✓ journals configured';
END
ELSE
    PRINT '  ✗ journals table not found';

-- ============================================================================
-- 4. BOOKS TABLE
-- ============================================================================
PRINT '';
PRINT 'Processing books table...';

IF OBJECT_ID(N'dbo.books', N'U') IS NOT NULL
BEGIN
    -- Core audit columns
    IF COL_LENGTH('dbo.books', 'created_at') IS NULL
    BEGIN
        ALTER TABLE dbo.books ADD created_at datetime2 NULL;
        PRINT '  ✓ Added created_at';
    END

    IF COL_LENGTH('dbo.books', 'updated_at') IS NULL
    BEGIN
        ALTER TABLE dbo.books ADD updated_at datetime2 NULL;
        PRINT '  ✓ Added updated_at';
    END

    -- Backfill timestamps
    UPDATE dbo.books
    SET created_at = ISNULL(created_at, SYSDATETIME()),
        updated_at = ISNULL(updated_at, SYSDATETIME())
    WHERE created_at IS NULL OR updated_at IS NULL;

    -- Enforce NOT NULL
    IF EXISTS(SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.books')
              AND name = 'created_at' AND is_nullable = 1)
        ALTER TABLE dbo.books ALTER COLUMN created_at datetime2 NOT NULL;

    IF EXISTS(SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.books')
              AND name = 'updated_at' AND is_nullable = 1)
        ALTER TABLE dbo.books ALTER COLUMN updated_at datetime2 NOT NULL;

    PRINT '  ✓ books configured';
END
ELSE
    PRINT '  ✗ books table not found';

-- ============================================================================
-- FINAL VERIFICATION & SUMMARY
-- ============================================================================
PRINT '';
PRINT '=== VERIFICATION SUMMARY ===';

DECLARE @confCheck INT = 0;
DECLARE @journalCheck INT = 0;
DECLARE @bookCheck INT = 0;

SELECT @confCheck = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'conference_proceedings'
  AND COLUMN_NAME IN ('created_at', 'updated_at', 'status', 'submitted_by');

SELECT @journalCheck = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'journals'
  AND COLUMN_NAME IN ('created_at', 'updated_at', 'status', 'submitted_by');

SELECT @bookCheck = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'books'
  AND COLUMN_NAME IN ('created_at', 'updated_at');

PRINT 'conference_proceedings: ' + CASE WHEN @confCheck = 4 THEN '✓ 4/4 columns' ELSE '✗ ' + CAST(@confCheck AS VARCHAR) + '/4' END;
PRINT 'journals: ' + CASE WHEN @journalCheck = 4 THEN '✓ 4/4 columns' ELSE '✗ ' + CAST(@journalCheck AS VARCHAR) + '/4' END;
PRINT 'books: ' + CASE WHEN @bookCheck = 2 THEN '✓ 2/2 columns' ELSE '✗ ' + CAST(@bookCheck AS VARCHAR) + '/2' END;

PRINT '';
PRINT '=== Patch Completed Successfully ===';

