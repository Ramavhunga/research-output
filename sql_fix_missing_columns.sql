-- ============================================================================
-- SQL Server Patch: Add Missing Workflow & Timestamp Columns
-- Safe idempotent script - checks existence before adding
-- ============================================================================

-- ============================================================================
-- CONFERENCE_PROCEEDINGS TABLE
-- ============================================================================
PRINT 'Adding missing columns to conference_proceedings...';

IF OBJECT_ID(N'dbo.conference_proceedings', N'U') IS NOT NULL
BEGIN
    -- Add created_at if missing
    IF COL_LENGTH('dbo.conference_proceedings', 'created_at') IS NULL
    BEGIN
        ALTER TABLE dbo.conference_proceedings ADD created_at datetime2 NULL;
        PRINT '  ✓ Added created_at column';
    END
    ELSE
        PRINT '  ✓ created_at already exists';

    -- Add updated_at if missing
    IF COL_LENGTH('dbo.conference_proceedings', 'updated_at') IS NULL
    BEGIN
        ALTER TABLE dbo.conference_proceedings ADD updated_at datetime2 NULL;
        PRINT '  ✓ Added updated_at column';
    END
    ELSE
        PRINT '  ✓ updated_at already exists';

    -- Add status if missing
    IF COL_LENGTH('dbo.conference_proceedings', 'status') IS NULL
    BEGIN
        ALTER TABLE dbo.conference_proceedings ADD status nvarchar(50) NULL;
        PRINT '  ✓ Added status column';
    END
    ELSE
        PRINT '  ✓ status already exists';

    -- Add submitted_by if missing
    IF COL_LENGTH('dbo.conference_proceedings', 'submitted_by') IS NULL
    BEGIN
        ALTER TABLE dbo.conference_proceedings ADD submitted_by bigint NULL;
        PRINT '  ✓ Added submitted_by column';
    END
    ELSE
        PRINT '  ✓ submitted_by already exists';

    -- Backfill timestamps for existing rows
    UPDATE dbo.conference_proceedings
    SET created_at = ISNULL(created_at, SYSDATETIME()),
        updated_at = ISNULL(updated_at, SYSDATETIME())
    WHERE created_at IS NULL OR updated_at IS NULL;

    -- Enforce NOT NULL constraints
    -- First check and drop any existing constraints that might prevent this
    IF EXISTS(SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.conference_proceedings') AND name = 'created_at' AND is_nullable = 1)
    BEGIN
        ALTER TABLE dbo.conference_proceedings ALTER COLUMN created_at datetime2 NOT NULL;
        PRINT '  ✓ Set created_at to NOT NULL';
    END

    IF EXISTS(SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.conference_proceedings') AND name = 'updated_at' AND is_nullable = 1)
    BEGIN
        ALTER TABLE dbo.conference_proceedings ALTER COLUMN updated_at datetime2 NOT NULL;
        PRINT '  ✓ Set updated_at to NOT NULL';
    END
END
ELSE
    PRINT '  Warning: conference_proceedings table not found!';

-- ============================================================================
-- JOURNALS TABLE
-- ============================================================================
PRINT '';
PRINT 'Adding missing columns to journals...';

IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL
BEGIN
    -- Add created_at if missing
    IF COL_LENGTH('dbo.journals', 'created_at') IS NULL
    BEGIN
        ALTER TABLE dbo.journals ADD created_at datetime2 NULL;
        PRINT '  ✓ Added created_at column';
    END
    ELSE
        PRINT '  ✓ created_at already exists';

    -- Add updated_at if missing
    IF COL_LENGTH('dbo.journals', 'updated_at') IS NULL
    BEGIN
        ALTER TABLE dbo.journals ADD updated_at datetime2 NULL;
        PRINT '  ✓ Added updated_at column';
    END
    ELSE
        PRINT '  ✓ updated_at already exists';

    -- Add status if missing
    IF COL_LENGTH('dbo.journals', 'status') IS NULL
    BEGIN
        ALTER TABLE dbo.journals ADD status nvarchar(50) NULL;
        PRINT '  ✓ Added status column';
    END
    ELSE
        PRINT '  ✓ status already exists';

    -- Add submitted_by if missing
    IF COL_LENGTH('dbo.journals', 'submitted_by') IS NULL
    BEGIN
        ALTER TABLE dbo.journals ADD submitted_by bigint NULL;
        PRINT '  ✓ Added submitted_by column';
    END
    ELSE
        PRINT '  ✓ submitted_by already exists';

    -- Backfill timestamps for existing rows
    UPDATE dbo.journals
    SET created_at = ISNULL(created_at, SYSDATETIME()),
        updated_at = ISNULL(updated_at, SYSDATETIME())
    WHERE created_at IS NULL OR updated_at IS NULL;

    -- Enforce NOT NULL constraints
    IF EXISTS(SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.journals') AND name = 'created_at' AND is_nullable = 1)
    BEGIN
        ALTER TABLE dbo.journals ALTER COLUMN created_at datetime2 NOT NULL;
        PRINT '  ✓ Set created_at to NOT NULL';
    END

    IF EXISTS(SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.journals') AND name = 'updated_at' AND is_nullable = 1)
    BEGIN
        ALTER TABLE dbo.journals ALTER COLUMN updated_at datetime2 NOT NULL;
        PRINT '  ✓ Set updated_at to NOT NULL';
    END
END
ELSE
    PRINT '  Warning: journals table not found!';

-- ============================================================================
-- BOOKS TABLE
-- ============================================================================
PRINT '';
PRINT 'Adding missing columns to books...';

IF OBJECT_ID(N'dbo.books', N'U') IS NOT NULL
BEGIN
    -- Add created_at if missing
    IF COL_LENGTH('dbo.books', 'created_at') IS NULL
    BEGIN
        ALTER TABLE dbo.books ADD created_at datetime2 NULL;
        PRINT '  ✓ Added created_at column';
    END
    ELSE
        PRINT '  ✓ created_at already exists';

    -- Add updated_at if missing
    IF COL_LENGTH('dbo.books', 'updated_at') IS NULL
    BEGIN
        ALTER TABLE dbo.books ADD updated_at datetime2 NULL;
        PRINT '  ✓ Added updated_at column';
    END
    ELSE
        PRINT '  ✓ updated_at already exists';

    -- Backfill timestamps for existing rows
    UPDATE dbo.books
    SET created_at = ISNULL(created_at, SYSDATETIME()),
        updated_at = ISNULL(updated_at, SYSDATETIME())
    WHERE created_at IS NULL OR updated_at IS NULL;

    -- Enforce NOT NULL constraints
    IF EXISTS(SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.books') AND name = 'created_at' AND is_nullable = 1)
    BEGIN
        ALTER TABLE dbo.books ALTER COLUMN created_at datetime2 NOT NULL;
        PRINT '  ✓ Set created_at to NOT NULL';
    END

    IF EXISTS(SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.books') AND name = 'updated_at' AND is_nullable = 1)
    BEGIN
        ALTER TABLE dbo.books ALTER COLUMN updated_at datetime2 NOT NULL;
        PRINT '  ✓ Set updated_at to NOT NULL';
    END
END
ELSE
    PRINT '  Warning: books table not found!';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
PRINT '';
PRINT '=== VERIFICATION ===';
PRINT 'conference_proceedings columns:';
SELECT 'created_at' AS col_name,
       CASE WHEN COL_LENGTH('dbo.conference_proceedings', 'created_at') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status;
SELECT 'updated_at' AS col_name,
       CASE WHEN COL_LENGTH('dbo.conference_proceedings', 'updated_at') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status;
SELECT 'status' AS col_name,
       CASE WHEN COL_LENGTH('dbo.conference_proceedings', 'status') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status;
SELECT 'submitted_by' AS col_name,
       CASE WHEN COL_LENGTH('dbo.conference_proceedings', 'submitted_by') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status;

PRINT '';
PRINT 'journals columns:';
SELECT 'created_at' AS col_name,
       CASE WHEN COL_LENGTH('dbo.journals', 'created_at') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status;
SELECT 'updated_at' AS col_name,
       CASE WHEN COL_LENGTH('dbo.journals', 'updated_at') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status;

PRINT '';
PRINT 'books columns:';
SELECT 'created_at' AS col_name,
       CASE WHEN COL_LENGTH('dbo.books', 'created_at') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status;
SELECT 'updated_at' AS col_name,
       CASE WHEN COL_LENGTH('dbo.books', 'updated_at') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status;

PRINT '';
PRINT '=== Patch complete ===';

