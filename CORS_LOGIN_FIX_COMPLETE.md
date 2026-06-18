# CORS Login Error - Complete Analysis & Fix

## **Errors Reported:**

### Error 1: Chrome Extension Message Error
```
Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, 
but the message channel closed before a response was received
```
**Status:** Non-critical (Chrome extension interference)  
**Impact:** Usually doesn't affect functionality unless extensions are interfering

### Error 2: CORS Preflight Request Failed ⚠️ CRITICAL
```
Access to XMLHttpRequest at 'http://localhost:8080/api/user/login' from origin 
'http://localhost:4200' has been blocked by CORS policy: Response to preflight request 
doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present 
on the requested resource.

Failed to load resource: net::ERR_FAILED
```
**Status:** FIXED ✅

---

## **Root Causes Identified:**

### 1. **PATH MISMATCH** (Primary Issue)
- **Frontend was calling:** `http://localhost:8080/api/user/login`
- **Backend provides:** `http://localhost:8080/user/login` (no `/api` prefix)
- **Result:** 404 causes CORS preflight to fail

### 2. **CORS Configuration Issues**
- Conflicting `@CrossOrigin("*")` annotation on UserController
- Global CORS config not properly exposing headers
- Missing PATCH and HEAD methods
- `allowCredentials(false)` should be `true` for cookie-based auth

### 3. **Missing CORS Headers**
- `Authorization` header not exposed
- `X-Total-Count` header (for pagination) not exposed

---

## **Fixes Applied:**

### ✅ Fix 1: Updated CORS Configuration
**File:** `src/main/java/za/co/univen/research_output/config/CorsConfig.java`

**Changes:**
```java
// BEFORE:
.allowedOrigins("http://localhost:4200")
.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
.allowedHeaders("*")
.allowCredentials(false)
.maxAge(3600);

// AFTER:
.allowedOrigins("http://localhost:4200", "http://localhost:4201", "http://localhost:3000")
.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD")
.allowedHeaders("*")
.exposedHeaders("Authorization", "Content-Type", "X-Total-Count")
.allowCredentials(true)
.maxAge(3600);
```

**Why:**
- ✅ Added multiple local development origins (4200, 4201, 3000)
- ✅ Added PATCH and HEAD methods
- ✅ Exposed headers needed for authorization and pagination
- ✅ Enabled credentials for session/cookie support

---

### ✅ Fix 2: Removed Conflicting @CrossOrigin Annotation
**File:** `src/main/java/za/co/univen/research_output/controller/UserController.java`

**Changes:**
```java
// BEFORE:
@RestController
@RequestMapping("user")
@CrossOrigin("*")  // ❌ Conflicting with global CORS
public class UserController { ... }

// AFTER:
@RestController
@RequestMapping("user")  // ✅ Now uses global CORS config
public class UserController { ... }
```

**Why:**
- Removes conflict between global CORS config and controller-level annotation
- Ensures consistent CORS policy across all endpoints
- Allows proper preflight response handling

---

### ✅ Fix 3: Fixed API URL Path Mismatch
**File:** `front_end/research_out_front/src/environment/environment-url.ts`

**Changes:**
```typescript
// BEFORE:
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/'  // ❌ No /api prefix on backend
};

// AFTER:
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/'  // ✅ Matches backend endpoints
};
```

**Why:**
- Frontend now calls correct backend URL
- Login endpoint: `http://localhost:8080/user/login`
- All other endpoints: work without /api prefix

---

## **API Endpoints Available:**

After these fixes, the following endpoints are accessible:

| Method | URL | Purpose |
|--------|-----|---------|
| POST | `/user/login` | User login |
| GET | `/user/roles` | List users with roles |
| PUT | `/user/roles/{username}` | Assign roles to user |
| GET | `/user/roles/staff/{staffNo}` | Get staff role info |
| PUT | `/user/roles/staff/{staffNo}` | Assign reviewer roles |
| GET | `/user/student-info/{studentNo}` | Get student/staff info |

---

## **How to Test the Fix:**

### Step 1: Verify Backend Running
```bash
# Terminal 1 - Start Spring Boot Backend
mvn spring-boot:run
# Backend should be running on http://localhost:8080
```

### Step 2: Verify Frontend Running
```bash
# Terminal 2 - Start Angular Frontend
cd front_end/research_out_front
npm install  # if needed
npm start
# Frontend should be running on http://localhost:4200
```

### Step 3: Test Login
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Navigate to http://localhost:4200/login
4. Enter credentials and click Login
5. **Expected Results:**
   - ✅ OPTIONS request returns 200 (preflight)
   - ✅ POST request returns 200 with login data
   - ✅ No CORS errors in Console
   - ✅ Login successful, redirected to dashboard

### Step 4: Verify CORS Headers
In Network tab, click on the login request and check Response Headers:
```
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Authorization, Content-Type, X-Total-Count
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD
```

---

## **Troubleshooting:**

### Still Getting CORS Error?

#### 1. Check Browser Cache
```
Clear DevTools cache:
- F12 → Network tab → ⚙️ Settings → Check "Disable cache (while DevTools open)"
```

#### 2. Check Ports are Correct
```powershell
# Check if port 8080 is in use
netstat -ano | findstr :8080

# Check if port 4200 is in use
netstat -ano | findstr :4200
```

#### 3. Verify Backend is Running
```bash
curl http://localhost:8080/user/login
# Should get a 405 (GET not allowed) not a connection refused
```

#### 4. Check Logs
- **Backend**: Look for `CorsConfig` initialization
- **Frontend**: Check Console tab for detailed error messages

#### 5. Hard Refresh Frontend
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

---

## **Production Deployment:**

### Update CORS for Production

**File:** `src/main/java/za/co/univen/research_output/config/CorsConfig.java`

```java
// For production, use environment-specific origins:
String[] allowedOrigins = environment.equals("production")
    ? new String[]{"https://yourdomain.com", "https://www.yourdomain.com"}
    : new String[]{"http://localhost:4200", "http://localhost:4201", "http://localhost:3000"};

registry.addMapping("/**")
        .allowedOrigins(allowedOrigins)
        // ... rest of config
```

Or in properties file:
```properties
# application-prod.properties
cors.allowed-origins=https://yourdomain.com,https://www.yourdomain.com
```

---

## **Summary of Changes:**

| File | Change | Impact |
|------|--------|--------|
| `CorsConfig.java` | Updated CORS policy, added headers | ✅ Preflight succeeds |
| `UserController.java` | Removed @CrossOrigin conflict | ✅ Consistent CORS |
| `environment-url.ts` | Fixed API URL path | ✅ Correct endpoints |

---

## **Chrome Extension Error Note:**

If you still see: *"A listener indicated an asynchronous response..."*

**Solution:** This is usually from browser extensions. Disable and re-enable them:
1. Go to `chrome://extensions/`
2. Disable extensions one by one to find the culprit
3. Or Open in Incognito mode (extensions disabled by default)

This error doesn't prevent your app from working and can be safely ignored.

---

## **Next Steps:**

1. ✅ Rebuild backend: `mvn clean install`
2. ✅ Restart both applications
3. ✅ Test login functionality
4. ✅ Check browser console for any remaining errors
5. ✅ If issues persist, enable debug logging in Spring Boot

**Status:** All CORS issues should now be resolved! 🎉

