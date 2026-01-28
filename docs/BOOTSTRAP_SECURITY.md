# Bootstrap SUPER_ADMIN Security

## Overview

The `/api/admin/bootstrap-super-admin` endpoint allows creating the first SUPER_ADMIN user. This document explains the security measures in place.

## Security Layers

### 1. Authentication Required ✅
- **Requirement**: User must be logged in (authenticated via Supabase)
- **Protection**: Prevents anonymous access
- **Error**: Returns `401 Unauthorized` if not authenticated

### 2. One-Time Only ✅
- **Requirement**: Only works if NO SUPER_ADMIN exists
- **Protection**: Prevents creating multiple SUPER_ADMINs
- **Error**: Returns `409 Conflict` if SUPER_ADMIN already exists

### 3. Self-Bootstrap or First User ✅
- **Requirement**: 
  - If no users exist: Anyone authenticated can bootstrap
  - If users exist: You can only bootstrap yourself (email must match authenticated user)
- **Protection**: Prevents unauthorized users from elevating others
- **Error**: Returns `403 Forbidden` if trying to bootstrap someone else

### 4. Email Allowlist (Optional) ✅
- **Requirement**: If `BOOTSTRAP_ALLOWED_EMAILS` is set, email must be in the list
- **Protection**: Restricts which emails can be bootstrapped
- **Configuration**: `BOOTSTRAP_ALLOWED_EMAILS=email1@example.com,email2@example.com`
- **Error**: Returns `403 Forbidden` if email not in allowlist

### 5. Production Secret (Optional) ✅
- **Requirement**: In production, if `BOOTSTRAP_SECRET` is set, request must include the secret
- **Protection**: Adds an extra layer for production environments
- **Configuration**: `BOOTSTRAP_SECRET=your-secret-token`
- **Usage**: Include in request body `{ "secret": "your-secret-token", "email": "..." }` or header `x-bootstrap-secret: your-secret-token`
- **Error**: Returns `403 Forbidden` if secret is invalid or missing

## Security Recommendations

### Development
- ✅ Authentication is sufficient
- ✅ No additional secrets needed

### Production
- ✅ **Required**: Set `BOOTSTRAP_SECRET` in environment variables
- ✅ **Recommended**: Set `BOOTSTRAP_ALLOWED_EMAILS` to restrict which emails can be bootstrapped
- ✅ **Recommended**: Set `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` to pre-configure the email
- ✅ **Important**: After bootstrap, the endpoint becomes read-only (returns 409)

## Usage Examples

### Development (No Secret)
```bash
# 1. Log in to the application first
# 2. Then call:
curl -X POST http://localhost:3000/api/admin/bootstrap-super-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'
```

### Production (With Secret)
```bash
# 1. Log in to the application first
# 2. Then call with secret:
curl -X POST https://your-domain.com/api/admin/bootstrap-super-admin \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: your-secret-token" \
  -d '{"email": "admin@example.com"}'

# OR include secret in body:
curl -X POST https://your-domain.com/api/admin/bootstrap-super-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "secret": "your-secret-token"}'
```

## After Bootstrap

Once a SUPER_ADMIN exists:
- ✅ Bootstrap endpoint returns `409 Conflict`
- ✅ Use `/api/admin/create-admin` instead (requires SUPER_ADMIN permissions)
- ✅ SUPER_ADMIN can manage all users and roles

## Environment Variables

```env
# Optional - for production security
BOOTSTRAP_SECRET=your-secret-token-here

# Optional - restrict which emails can be bootstrapped
BOOTSTRAP_ALLOWED_EMAILS=admin1@example.com,admin2@example.com

# Optional - default email to bootstrap
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=admin@example.com
```

## Security Checklist

- [x] Authentication required
- [x] One-time only (disabled after first SUPER_ADMIN)
- [x] Self-bootstrap or first-user only
- [x] Optional email allowlist
- [x] Optional production secret
- [x] User must exist in database (created via Supabase Auth + first login)

## Best Practices

1. **Set `BOOTSTRAP_SECRET` in production** - Adds an extra security layer
2. **Set `BOOTSTRAP_ALLOWED_EMAILS`** - Restricts which emails can be bootstrapped
3. **Bootstrap immediately after deployment** - Reduces the window where the endpoint is accessible
4. **Monitor logs** - Watch for unauthorized bootstrap attempts
5. **Use strong secrets** - Generate a random, long secret token

## Troubleshooting

### "Unauthorized" Error
- **Cause**: Not logged in
- **Fix**: Log in to the application first, then call the endpoint

### "SUPER_ADMIN already exists" Error
- **Cause**: Bootstrap already completed
- **Fix**: Use `/api/admin/create-admin` instead (requires SUPER_ADMIN permissions)

### "Email not in bootstrap allowlist" Error
- **Cause**: `BOOTSTRAP_ALLOWED_EMAILS` is set and email is not in the list
- **Fix**: Add email to `BOOTSTRAP_ALLOWED_EMAILS` or remove the env var

### "Invalid bootstrap secret" Error
- **Cause**: Production mode requires secret, but it's missing or incorrect
- **Fix**: Set `BOOTSTRAP_SECRET` in environment and include it in the request
