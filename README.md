# Healthcare Frontend Web Application

A modern healthcare application built with Next.js 14, React Server Components, TanStack Query, and Server Actions.

## Features

- Server-Side Rendering (SSR) with Next.js 14
- React Server Components for improved performance
- TanStack Query for efficient data fetching and caching
- Server Actions for secure server-side mutations
- Authentication with multiple methods (Email/Password, OTP, Magic Link)
- Session management with active sessions tracking
- TypeScript for type safety
- Modern UI with Tailwind CSS

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd healthcarefrontend-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_API_URL=https://api.ishswami.in
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
NEXT_PUBLIC_APPLE_CLIENT_ID=your_apple_client_id
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── providers/         # React context providers
│   └── layout.tsx         # Root layout
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and server actions
│   ├── actions/          # Server actions
│   └── schema/           # Validation schemas
└── types/                # TypeScript type definitions
```

## Authentication Flow

The application supports multiple authentication methods:

1. Email/Password
2. OTP verification
3. Magic Link
4. Social Login (Google, Facebook, Apple)

Authentication state is managed using TanStack Query and Server Actions, providing:

- Automatic session management
- Secure token handling
- Active sessions tracking
- Session termination capabilities

## Data Fetching

We use TanStack Query for efficient data fetching and caching:

```typescript
// Example query
const { data, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: fetchData,
});

// Example mutation
const { mutate } = useMutation({
  mutationFn: updateData,
  onSuccess: () => {
    // Handle success
  },
});
```

## Server Actions

Server-side mutations are handled using Next.js Server Actions:

```typescript
// Example server action
async function serverAction(formData: FormData) {
  'use server';
  // Handle server-side logic
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
