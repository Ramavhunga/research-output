package za.co.univen.research_output.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

// DISABLED: Schema initialization disabled to prevent Spring SQL parser issues.
// All payload normalization now handled by @JsonSetter in entities.
// @Component
public class DatabaseCompatibilityRepairRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseCompatibilityRepairRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Keep startup resilient: repair tries best-effort and must not stop the app.
        try {
            jdbcTemplate.execute("""
                IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL
                   AND EXISTS (
                       SELECT 1
                       FROM sys.columns c
                       INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
                       WHERE c.object_id = OBJECT_ID(N'dbo.journals')
                         AND c.name = 'comply'
                         AND t.name = 'bit'
                   )
                BEGIN
                    IF COL_LENGTH('dbo.journals', 'comply_tmp') IS NULL
                        ALTER TABLE dbo.journals ADD comply_tmp nvarchar(10);

                    UPDATE dbo.journals
                    SET comply_tmp = CASE
                        WHEN comply = 1 THEN 'Yes'
                        WHEN comply = 0 THEN 'No'
                        ELSE 'N/A'
                    END;

                    ALTER TABLE dbo.journals DROP COLUMN comply;
                    EXEC sp_rename 'dbo.journals.comply_tmp', 'comply', 'COLUMN';
                END;
                """);
        } catch (Exception ignored) {
        }

        try {
            jdbcTemplate.execute("""
                IF OBJECT_ID(N'dbo.conference_proceedings', N'U') IS NOT NULL AND COL_LENGTH('dbo.conference_proceedings', 'created_at') IS NULL
                    ALTER TABLE dbo.conference_proceedings ADD created_at datetime2;
                IF OBJECT_ID(N'dbo.conference_proceedings', N'U') IS NOT NULL AND COL_LENGTH('dbo.conference_proceedings', 'updated_at') IS NULL
                    ALTER TABLE dbo.conference_proceedings ADD updated_at datetime2;

                IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'created_at') IS NULL
                    ALTER TABLE dbo.journals ADD created_at datetime2;
                IF OBJECT_ID(N'dbo.journals', N'U') IS NOT NULL AND COL_LENGTH('dbo.journals', 'updated_at') IS NULL
                    ALTER TABLE dbo.journals ADD updated_at datetime2;

                IF OBJECT_ID(N'dbo.books', N'U') IS NOT NULL AND COL_LENGTH('dbo.books', 'created_at') IS NULL
                    ALTER TABLE dbo.books ADD created_at datetime2;
                IF OBJECT_ID(N'dbo.books', N'U') IS NOT NULL AND COL_LENGTH('dbo.books', 'updated_at') IS NULL
                    ALTER TABLE dbo.books ADD updated_at datetime2;
                """);
        } catch (Exception ignored) {
        }
    }
}

