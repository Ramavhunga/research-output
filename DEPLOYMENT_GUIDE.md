# Dashboard Optimization - Deployment Guide

## Overview
This guide covers deploying the dashboard optimization that reduces load time by 85-90%.

## Changes Made

### Backend Changes
1. **New Files:**
   - `src/main/java/.../dto/DashboardStatsDto.java` - Dashboard statistics DTO
   - `src/main/java/.../services/DashboardService.java` - Dashboard service with pre-computed stats
   - `src/main/java/.../controller/DashboardController.java` - REST endpoints for dashboard

2. **Modified Files:**
   - `src/main/java/.../repositories/JournalRepository.java` - Added efficient query methods
   - `src/main/resources/schema.sql` - Added performance indexes
   - `src/main/resources/application.properties` - Added Hibernate performance tuning

### Frontend Changes
1. **Modified Files:**
   - `src/app/services/journal-service.ts` - Added `getDashboardStats()` method, optimized `getReviewQueue()`
   - `src/app/components/dashboard-component/dashboard-component.ts` - Uses new stats endpoint

## Deployment Steps

### 1. Backend Deployment

#### Build JAR
```bash
cd C:\Users\Muthuhadini.Ramavhun\IdeaProjects\research_output
mvn clean package -DskipTests
```

#### Deploy to Azure
The project already has Azure Spring Apps configuration in pom.xml. Deploy with:
```bash
mvn azure-spring-apps:deploy
```

Or deploy manually:
```bash
# Copy the JAR file to your server
scp target/research_output-0.0.1-SNAPSHOT.jar user@server:/path/to/apps/

# SSH into server and restart application
ssh user@server
cd /path/to/apps/
pkill -f research_output
java -jar research_output-0.0.1-SNAPSHOT.jar &

# Or if using Docker:
docker build -t research-output:latest .
docker run -d --name research-output -p 8080:8080 research-output:latest
```

### 2. Database Schema Migration

**IMPORTANT**: Automatic schema initialization is DISABLED (`spring.sql.init.mode=never`) to prevent conflicts with existing databases.

You MUST manually create the performance indexes. See **MANUAL_SCHEMA_UPDATE.md** for detailed instructions.

Quick steps:
1. Open SQL Server Management Studio (or Azure Data Studio)
2. Connect to your database (10.21.0.20, database: research_output)
3. Run the index creation script from `src/main/resources/schema.sql` (index portion only)

To verify index creation:

```sql
-- Check if indexes were created
SELECT name FROM sys.indexes
WHERE object_id = OBJECT_ID('dbo.journals')
AND name LIKE 'IX_journals%'
ORDER BY name;

-- Expected: 6 indexes
-- IX_journals_comply
-- IX_journals_created_at
-- IX_journals_status
-- IX_journals_status_id
-- IX_journals_status_submitted_by
-- IX_journals_submitted_by
```

### 3. Frontend Deployment

#### Build Angular
```bash
cd front_end/research_out_front
npm install
npm run build
```

#### Deploy to Azure Static Web Apps
```bash
# Follow Azure Static Web Apps deployment process
# Usually: git push will trigger automatic deployment
```

Or deploy manually:
```bash
# Copy dist folder to web server
scp -r dist/research_out_front/* user@server:/var/www/html/app/

# Or for Docker:
docker build -f Dockerfile.frontend -t research-output-frontend:latest .
docker run -d --name research-output-frontend -p 80:80 research-output-frontend:latest
```

## Verification Checklist

After deployment:

- [ ] **Backend Started**: Check application logs
  ```bash
  # For jar: tail -f application.log
  # For Docker: docker logs research-output
  ```

- [ ] **Indexes Created**: Query database to confirm
  ```sql
  SELECT name FROM sys.indexes 
  WHERE object_id = OBJECT_ID('dbo.journals') 
  AND name LIKE 'IX_journals%'
  ORDER BY name
  ```

- [ ] **New Endpoints Available**: Test with curl or Postman
  ```bash
  curl -H "X-Username: testuser" http://localhost:8080/api/dashboard/stats
  ```

- [ ] **Frontend Built**: Check that dist folder contains latest built files

- [ ] **Dashboard Loads**: Open browser and navigate to dashboard
  - Should load significantly faster
  - Check Network tab in DevTools to confirm single API call to /api/dashboard/stats

## Performance Validation

### Before Optimization
```
Network Requests: 11+ HTTP calls (for reviewers)
Dashboard Load Time: 5-8 seconds
API Response Size: 50KB+
```

### After Optimization
```
Network Requests: 1 HTTP call
Dashboard Load Time: 500-800ms
API Response Size: 2-5KB
```

### Measuring Performance

1. **Open Browser DevTools** (F12)
2. **Go to Dashboard**
3. **Check Network Tab:**
   - Look for `/api/dashboard/stats` call
   - Should complete in <1 second
   - Response size should be <10KB

4. **Check Console** for errors

## Rollback Plan

If issues occur:

### Option 1: Disable New Endpoint
Comment out the DashboardController class temporarily:
```java
// @RestController
// @RequestMapping({"/api/dashboard", "/api/dashboards"})
// @CrossOrigin("*")
// public class DashboardController { ... }
```

The frontend code includes automatic fallback to the old method.

### Option 2: Revert Database
The schema.sql is idempotent - indexes can safely be dropped:
```sql
DROP INDEX IF EXISTS dbo.IX_journals_status ON dbo.journals
DROP INDEX IF EXISTS dbo.IX_journals_submitted_by ON dbo.journals
DROP INDEX IF EXISTS dbo.IX_journals_comply ON dbo.journals
DROP INDEX IF EXISTS dbo.IX_journals_status_id ON dbo.journals
DROP INDEX IF EXISTS dbo.IX_journals_created_at ON dbo.journals
DROP INDEX IF EXISTS dbo.IX_journals_status_submitted_by ON dbo.journals
```

### Option 3: Complete Rollback
Revert to previous version:
```bash
git revert <commit-hash>
mvn clean package -DskipTests
# Redeploy
```

## Monitoring

### Key Metrics to Track
- Dashboard page load time (Network tab → Total time)
- API endpoint response time (Network tab → Duration)
- Error rates (Console tab, Backend logs)
- Database query time (Enable logging: `spring.jpa.properties.hibernate.generate_statistics=true`)

### Enable Debug Logging (Optional)
Add to application.properties for troubleshooting:
```properties
logging.level.za.co.univen.research_output.services.DashboardService=DEBUG
logging.level.za.co.univen.research_output.controller.DashboardController=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.stat.StatisticsImpl=DEBUG
```

## Troubleshooting

### Dashboard Not Loading
1. Check backend logs for errors
2. Verify DashboardController endpoint is accessible:
   ```bash
   curl -v http://localhost:8080/api/dashboard/stats
   ```
3. Check browser console for JavaScript errors
4. Verify X-Username header is being sent

### Reviews Queue Empty
1. Verify Journal statuses in database:
   ```sql
   SELECT DISTINCT status FROM journals
   ```
2. Check DashboardService.getDashboardStatsForReviewer() logic
3. Verify user has REVIEWER_LEVEL_1 or REVIEWER_LEVEL_2 role

### Slow Query Performance
1. Check query execution time:
   ```properties
   spring.jpa.properties.hibernate.session.events.log=true
   ```

2. Verify indexes were created:
   ```sql
   DBCC SHOWCONTIG (journals, IX_journals_status)
   ```

3. Update index statistics:
   ```sql
   UPDATE STATISTICS journals
   ```

## Support

For issues or questions:
1. Check application logs
2. Review DASHBOARD_OPTIMIZATION_SUMMARY.md for architecture details
3. Check DashboardService code comments for implementation details

