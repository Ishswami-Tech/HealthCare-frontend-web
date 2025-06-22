# Profile Completion System

This document describes the profile completion system used in the healthcare application.

## Overview

The profile completion system ensures that users provide all necessary information before accessing the main application features. This is particularly important for healthcare applications where user information is critical for proper service delivery.

## Architecture

### 1. **Profile Completion Utilities** (`/lib/profile/index.ts`)

The main utilities file contains all the functions needed to handle profile completion logic:

- **`checkProfileCompletion(profileData)`**: Checks if a user's profile is complete based on their role
- **`shouldRedirectToProfileCompletion()`**: Determines if a user should be redirected to profile completion
- **`getProfileCompletionRedirectUrl()`**: Gets the appropriate redirect URL after profile completion
- **`validateProfileData()`**: Validates profile data for a specific role
- **`transformApiResponse()`**: Transforms API response to match expected format

### 2. **Profile Completion Form** (`/components/global/forms/ProfileCompletionForm.tsx`)

The main form component that handles profile completion:

- Uses React Hook Form with Zod validation
- Supports role-specific fields (Doctor, Clinic Admin, etc.)
- Handles form submission and error states
- Integrates with the authentication system

### 3. **Profile Completion Page** (`/app/(home)/profile-completion/page.tsx`)

The page component that renders the profile completion form:

- Checks if user is authenticated
- Verifies if profile is already complete
- Handles redirects appropriately

## Required Fields

### All Users
- First Name (minimum 2 characters)
- Last Name (minimum 2 characters)
- Phone Number (minimum 10 digits)
- Date of Birth (must be at least 12 years old)
- Gender (male, female, other)
- Address (minimum 10 characters)
- Emergency Contact Information (minimum 5 characters)

### Role-Specific Optional Fields

#### Doctor
- Specialization
- License Number
- Years of Experience

#### Clinic Admin
- Clinic Name
- Clinic Address

## Usage Examples

### Checking Profile Completion

```typescript
import { checkProfileCompletion } from '@/lib/profile';

const profileData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'patient',
  phone: '1234567890',
  dateOfBirth: '1990-01-01',
  gender: 'male',
  address: '123 Main St, City, State',
  emergencyContact: 'Jane Doe (Spouse): 0987654321'
};

const status = checkProfileCompletion(profileData);
console.log(status.isComplete); // true/false
console.log(status.missingFields); // array of missing fields
```

### Redirect Logic

```typescript
import { shouldRedirectToProfileCompletion } from '@/lib/profile';

const shouldRedirect = shouldRedirectToProfileCompletion(
  isAuthenticated,
  profileComplete,
  currentPath
);

if (shouldRedirect) {
  router.push('/profile-completion');
}
```

### Form Validation

```typescript
import { validateProfileData } from '@/lib/profile';

const formData = {
  firstName: 'John',
  lastName: 'Doe',
  // ... other fields
};

const validation = validateProfileData(formData);
if (!validation.isValid) {
  console.log(validation.errors); // array of error messages
}
```

## Integration with Authentication

The profile completion system integrates with the authentication system through:

1. **Session Management**: Uses the user session to determine profile completion status
2. **Cookie Management**: Stores profile completion status in cookies for persistence
3. **Middleware Integration**: Automatically redirects users to profile completion when needed

## Error Handling

The system provides comprehensive error handling:

- **Validation Errors**: Field-level validation with specific error messages
- **API Errors**: Handles server errors gracefully
- **Session Errors**: Manages session expiration and invalid sessions
- **Form Errors**: Displays form-level error summaries

## Best Practices

1. **Progressive Enhancement**: Start with basic fields and add role-specific fields as needed
2. **Validation**: Use both client-side and server-side validation
3. **Error Messages**: Provide clear, actionable error messages
4. **Accessibility**: Ensure all form elements are accessible
5. **Performance**: Optimize form rendering and submission

## Future Enhancements

1. **Multi-step Forms**: Break down profile completion into multiple steps
2. **File Upload**: Support for profile pictures and documents
3. **Address Validation**: Integrate with address validation services
4. **Progress Indicators**: Show completion progress to users
5. **Auto-save**: Automatically save form data as users type 