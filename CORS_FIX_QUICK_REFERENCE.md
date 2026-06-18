# 🔧 CORS Login Error - Quick Fix Reference

## What Was Wrong?

```
❌ Error: Access to XMLHttpRequest blocked by CORS policy
Origin: http://localhost:4200
Target: http://localhost:8080/api/user/login
Status: Preflight failed - No Access-Control-Allow-Origin header
```

## Root Causes
1. **Path mismatch**: Frontend calling `/api/user/login` but backend has only `/user/login`
2. **Conflicting CORS settings**: `@CrossOrigin("*")` vs global CORS config
3. **Missing CORS headers**: Authorization, X-Total-Count not exposed

## ✅ What Was Fixed

### 1. Backend CORS Configuration Updated
```
File: src/main/java/za/co/univen/research_output/config/CorsConfig.java
✅ Added multiple allowed origins (4200, 4201, 3000)
✅ Added PATCH, HEAD methods
✅ Exposed Authorization & X-Total-Count headers
✅ Enabled credentials (allowCredentials=true)
```

### 2. Removed Conflicting Annotation
```
File: src/main/java/za/co/univen/research_output/controller/UserController.java
✅ Removed: @CrossOrigin("*") → Now uses global CORS config
```

### 3. Fixed Frontend API URL
```
File: front_end/research_out_front/src/environment/environment-url.ts
❌ Before: 'http://localhost:8080/api/'
✅ After:  'http://localhost:8080/'
```

## 🚀 Quick Test

```bash
# Terminal 1: Start Backend
mvn spring-boot:run
# Runs on http://localhost:8080

# Terminal 2: Start Frontend
cd front_end/research_out_front && npm start
# Runs on http://localhost:4200
```

### Check in Browser DevTools (F12)
1. Go to http://localhost:4200/login
2. Open **Network** tab
3. Try to login
4. **Look for:**
   - ✅ OPTIONS request → 200 (preflight success)
   - ✅ POST request → 200 (login success)
   - ✅ Console: NO CORS errors

### Verify CORS Headers
In Network tab, find the login POST request:
- **Headers > Response Headers** should show:
  ```
  Access-Control-Allow-Origin: http://localhost:4200
  Access-Control-Allow-Credentials: true
  ```

## 📋 Before & After

| Issue | Before | After |
|-------|--------|-------|
| URL Path | `/api/user/login` (wrong) | `/user/login` ✅ |
| CORS Conflict | @CrossOrigin + global | Only global ✅ |
| Credentials | Disabled | Enabled ✅ |
| Headers | Missing auth headers | All exposed ✅ |
| Preflight | Failing (405/CORS error) | Passing (200) ✅ |

## ⚙️ API Endpoints (Now Working)

```
POST   /user/login                    → Login
GET    /user/roles                    → List users
PUT    /user/roles/{username}         → Assign roles
GET    /user/roles/staff/{staffNo}    → Get staff roles
PUT    /user/roles/staff/{staffNo}    → Update staff roles
GET    /user/student-info/{studentNo} → Get student info
```

## 🔍 Still Having Issues?

1. **Clear browser cache**: Ctrl+Shift+R
2. **Rebuild backend**: `mvn clean install`
3. **Check ports**: Are 8080 & 4200 free?
4. **Restart both apps**: Stop and start again
5. **Check console**: F12 → Console tab for detailed errors

## 📚 Full Documentation

See: `CORS_LOGIN_FIX_COMPLETE.md` for detailed troubleshooting and production setup

