# Centralized Profile Completion System

This document describes the centralized profile completion system that ensures users complete their essential medical information before accessing the healthcare application.

## Overview

The profile completion system is designed to:
- **Enforce mandatory medical information** collection for all users
- **Prevent dashboard access** until essential details are provided
- **Smart pre-filling** with existing data to minimize user effort
- **Role-based requirements** for different user types
- **Centralized logic** for consistent behavior across the application

## Architecture

### Core Components

1. **Profile Completion Utilities** (`/lib/utils/profile-completion.ts`)
   - Centralized logic for profile completion checks
   - Validation functions for different user roles
   - Helper functions for redirects and status checks

2. **Profile Completion Form** (`/components/global/forms/ProfileCompletionForm.tsx`)
   - Smart form that pre-fills existing data
   - Role-based field requirements
   - Real-time validation and submission

3. **Profile Completion Page** (`/app/(home)/profile-completion/page.tsx`)
   - Dedicated page for profile completion flow
   - Handles authentication and completion checks

4. **Middleware Integration** (`/middleware.ts`)
   - Automatically redirects incomplete profiles
   - Prevents access to protected routes

## Required Fields (All Users)

These fields are **mandatory** and must be completed before accessing the dashboard:

### Basic Information
- **First Name** - User's first name
- **Last Name** - User's last name  
- **Phone Number** - Contact phone number
- **Date of Birth** - Birth date for medical records
- **Gender** - Gender identification
- **Address** - Complete residential address

### Emergency Contact
- **Emergency Contact Name** - Name of emergency contact
- **Emergency Contact Phone** - Phone number of emergency contact
- **Emergency Contact Relationship** - Relationship to user (e.g., Spouse, Parent)

## Optional Fields (Role-based)

### Doctor-Specific (Optional)
- **Specialization** - Medical specialization
- **License Number** - Medical license number
- **Years of Experience** - Professional experience

### Clinic Admin-Specific (Optional)
- **Clinic Name** - Name of the clinic
- **Clinic Address** - Address of the clinic

## User Flow

### 1. Login/Registration
```
User logs in → Check profile completion status
├─ Complete → Redirect to dashboard
└─ Incomplete → Redirect to profile completion
```

### 2. Profile Completion
```
Load existing data → Pre-fill form → User completes required fields
├─ Submit → Update profile → Set completion cookie → Redirect to dashboard
└─ Cancel → Stay on form (user cannot access dashboard)
```

### 3. Dashboard Access
```
Middleware checks → Profile complete cookie
├─ True → Allow access
└─ False → Redirect to profile completion
```

## Implementation Details

### Profile Completion Utilities

```typescript
// Check if profile is complete
const status = checkProfileCompletion(profileData);
// Returns: { isComplete: boolean, missingFields: string[], requiredFields: string[], optionalFields: string[] }

// Check if user should be redirected
const shouldRedirect = shouldRedirectToProfileCompletion(isAuthenticated, profileComplete, currentPath);

// Get redirect URL after completion
const redirectUrl = getProfileCompletionRedirectUrl(userRole, originalPath);
```

### Middleware Integration

The middleware automatically checks for profile completion:

```typescript
// Check if profile is complete for authenticated users using centralized logic
if (shouldRedirectToProfileCompletion(!!accessToken, profileComplete, pathname)) {
  console.log('Middleware - Profile not complete, redirecting to profile completion');
  const profileCompletionUrl = new URL('/profile-completion', request.url);
  profileCompletionUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(profileCompletionUrl);
}
```

### Cookie Management

Profile completion status is stored in cookies:

```typescript
// Set profile completion status
await setProfileComplete(true);

// Check profile completion status
const profileComplete = request.cookies.get('profile_complete')?.value === 'true';
```

## Data Flow

### 1. Login Process
1. User logs in via email/password or OAuth
2. Server returns user data including `profileComplete` status
3. Client sets profile completion cookie
4. If profile incomplete, redirect to `/profile-completion`

### 2. Profile Completion Process
1. Form loads existing profile data from API
2. Pre-fills form with available data
3. User completes required fields
4. Form submits to update profile
5. Server marks profile as complete
6. Client sets completion cookie
7. Redirect to original destination or dashboard

### 3. Dashboard Access
1. Middleware checks profile completion cookie
2. If incomplete, redirect to profile completion
3. If complete, allow access to dashboard

## Security Considerations

### Medical Data Protection
- All profile data is encrypted in transit
- Sensitive information is stored securely
- Access is restricted to authenticated users only

### Cookie Security
- Profile completion cookies are HttpOnly
- Secure flag enabled in production
- SameSite set to 'strict' for CSRF protection

### Validation
- Server-side validation of all profile data
- Client-side validation with Zod schemas
- Role-based field requirements enforced

## Error Handling

### Common Scenarios
1. **Network Errors** - Retry mechanisms for API calls
2. **Validation Errors** - Clear error messages for users
3. **Session Expiry** - Automatic redirect to login
4. **Profile Data Conflicts** - Merge strategies for existing data

### Fallback Behavior
- If profile data cannot be loaded, start with empty form
- If submission fails, show error and allow retry
- If cookies cannot be set, fall back to session storage

## Testing

### Test Cases
1. **New User Registration** - Should redirect to profile completion
2. **Existing User Login** - Should check profile completion status
3. **Profile Completion** - Should validate required fields
4. **Dashboard Access** - Should block incomplete profiles
5. **Role-based Fields** - Should show appropriate optional fields

### Test Scenarios
- User with complete profile logs in → Dashboard access
- User with incomplete profile logs in → Profile completion form
- User completes profile → Redirect to dashboard
- User tries to access dashboard with incomplete profile → Redirect to completion

## Performance Considerations

### Optimization Strategies
- **Lazy Loading** - Profile data loaded only when needed
- **Caching** - Profile data cached in React Query
- **Pre-filling** - Existing data loaded once and reused
- **Validation** - Client-side validation to reduce server calls

### Monitoring
- Track profile completion rates
- Monitor completion time
- Identify common abandonment points
- Measure user satisfaction

## Future Enhancements

### Planned Features
1. **Progressive Profile Completion** - Allow partial completion
2. **Profile Completion Progress** - Visual progress indicator
3. **Bulk Profile Import** - Import profiles from external systems
4. **Profile Templates** - Pre-defined templates for different roles
5. **Profile Verification** - Additional verification for medical staff

### Integration Opportunities
1. **Electronic Health Records** - Integration with EHR systems
2. **Identity Verification** - Third-party identity verification
3. **Document Upload** - License and certification uploads
4. **Background Checks** - Automated background verification

## Troubleshooting

### Common Issues
1. **Infinite Redirect Loops** - Check cookie settings and middleware logic
2. **Form Not Pre-filling** - Verify API endpoints and data structure
3. **Validation Errors** - Check Zod schema and field requirements
4. **Session Issues** - Verify authentication flow and token handling

### Debug Steps
1. Check browser cookies for profile completion status
2. Verify API responses for profile data
3. Check middleware logs for redirect decisions
4. Validate form data structure and requirements

## API Endpoints

### Required Backend Endpoints
- `GET /user/profile` - Fetch user profile data
- `PUT /user/profile` - Update user profile
- `POST /auth/login` - Login with profile completion status
- `POST /auth/social/google` - OAuth login with profile completion status

### Response Format
```typescript
interface ProfileResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  profileComplete: boolean;
  // Role-specific fields...
}
```

This centralized system ensures consistent, secure, and user-friendly profile completion across the healthcare application while maintaining the highest standards for medical data collection and user experience. 