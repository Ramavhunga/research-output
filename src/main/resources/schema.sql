-- Idempotent SQL Server patch: align dbo.journals with current JPA mapping.
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'dhet_no') IS NULL
    ALTER TABLE dbo.journals ADD dhet_no nvarchar(255);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'year') IS NULL
    ALTER TABLE dbo.journals ADD year nvarchar(50);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'status') IS NULL
    ALTER TABLE dbo.journals ADD status nvarchar(50);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'title') IS NULL
    ALTER TABLE dbo.journals ADD title nvarchar(1000);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'journal_title') IS NULL
    ALTER TABLE dbo.journals ADD journal_title nvarchar(1000);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'publisher') IS NULL
    ALTER TABLE dbo.journals ADD publisher nvarchar(255);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'idx') IS NULL
    ALTER TABLE dbo.journals ADD idx nvarchar(255);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'comply') IS NULL
    ALTER TABLE dbo.journals ADD comply bit;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'volume') IS NULL
    ALTER TABLE dbo.journals ADD volume int;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'issue') IS NULL
    ALTER TABLE dbo.journals ADD issue int;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'issn') IS NULL
    ALTER TABLE dbo.journals ADD issn nvarchar(255);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'eissn') IS NULL
    ALTER TABLE dbo.journals ADD eissn nvarchar(255);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'doi') IS NULL
    ALTER TABLE dbo.journals ADD doi nvarchar(255);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'urls') IS NULL
    ALTER TABLE dbo.journals ADD urls nvarchar(1000);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'funders') IS NULL
    ALTER TABLE dbo.journals ADD funders nvarchar(1000);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'fieldofsearch') IS NULL
    ALTER TABLE dbo.journals ADD fieldofsearch nvarchar(255);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'openaccess') IS NULL
    ALTER TABLE dbo.journals ADD openaccess bit;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'dhet_accepted') IS NULL
    ALTER TABLE dbo.journals ADD dhet_accepted bit;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'dhet_units_awarded') IS NULL
    ALTER TABLE dbo.journals ADD dhet_units_awarded float;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'dhet_comments') IS NULL
    ALTER TABLE dbo.journals ADD dhet_comments nvarchar(1000);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'publicationfeedescription') IS NULL
    ALTER TABLE dbo.journals ADD publicationfeedescription nvarchar(255);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'publishercurrency') IS NULL
    ALTER TABLE dbo.journals ADD publishercurrency nvarchar(100);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'totalpublicationfeepublishercurrency') IS NULL
    ALTER TABLE dbo.journals ADD totalpublicationfeepublishercurrency float;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'publicationfeearticle') IS NULL
    ALTER TABLE dbo.journals ADD publicationfeearticle float;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'authorscontributionfee') IS NULL
    ALTER TABLE dbo.journals ADD authorscontributionfee float;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'authorscontributionfeezar') IS NULL
    ALTER TABLE dbo.journals ADD authorscontributionfeezar float;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'submitted_by') IS NULL
    ALTER TABLE dbo.journals ADD submitted_by bigint;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'created_at') IS NULL
    ALTER TABLE dbo.journals ADD created_at datetime2;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'updated_at') IS NULL
    ALTER TABLE dbo.journals ADD updated_at datetime2;

-- Embedded Units
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'max_units_for_publication') IS NULL
    ALTER TABLE dbo.journals ADD max_units_for_publication float;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'total_proportion_of_authors') IS NULL
    ALTER TABLE dbo.journals ADD total_proportion_of_authors float;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'author_count') IS NULL
    ALTER TABLE dbo.journals ADD author_count int;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'total_units_claimed') IS NULL
    ALTER TABLE dbo.journals ADD total_units_claimed float;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'other_authors_non_affiliates') IS NULL
    ALTER TABLE dbo.journals ADD other_authors_non_affiliates int;

-- Embedded ClaimingAuthorsContribution
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'proportion_of_authors') IS NULL
    ALTER TABLE dbo.journals ADD proportion_of_authors float;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'author_units_claimed') IS NULL
    ALTER TABLE dbo.journals ADD author_units_claimed float;
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'additional_comments') IS NULL
    ALTER TABLE dbo.journals ADD additional_comments nvarchar(2000);
IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'journal_additional_comments') IS NULL
    ALTER TABLE dbo.journals ADD journal_additional_comments nvarchar(2000);

-- Author-level comments
IF OBJECT_ID(N'dbo.authors', N'U') IS NOT NULL AND COL_LENGTH('dbo.authors', 'additional_comments') IS NULL
    ALTER TABLE dbo.authors ADD additional_comments nvarchar(2000);
IF OBJECT_ID(N'dbo.authors', N'U') IS NOT NULL AND COL_LENGTH('dbo.authors', 'dob') IS NULL
    ALTER TABLE dbo.authors ADD dob nvarchar(50);

-- Create journal_approvals audit table idempotently for workflow timeline logging.
IF OBJECT_ID(N'dbo.journal_approvals', N'U') IS NULL
    CREATE TABLE dbo.journal_approvals (
        id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
        journal_id bigint NOT NULL,
        action_by nvarchar(255) NOT NULL,
        action_role nvarchar(255) NOT NULL,
        action nvarchar(50) NOT NULL,
        comments nvarchar(2000) NULL,
        action_date datetime2 NOT NULL
    );

IF OBJECT_ID(N'dbo.journal_approvals', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = 'fk_journal_approvals_journal'
   )
    ALTER TABLE dbo.journal_approvals
        ADD CONSTRAINT fk_journal_approvals_journal
        FOREIGN KEY (journal_id) REFERENCES dbo.journals(id);

-- PERFORMANCE OPTIMIZATION: Create indexes for frequently queried columns
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

