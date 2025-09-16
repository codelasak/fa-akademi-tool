# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Fennaver Akademi Platform** - a comprehensive academy management system built with Next.js, TypeScript, Prisma, and PostgreSQL. It's a Turkish academy management platform that handles schools, classes, teachers, students, attendance, payments, and curriculum management.

## Development Commands

### Essential Commands
```bash
# Development
npm run dev              # Start development server on localhost:3000
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema changes to database
npx prisma studio        # Open database browser

# Scripts
npx tsx scripts/seed.ts          # Seed database with test data
npx tsx scripts/create-default-policy.ts  # Create default attendance policy
```

### Type Checking
```bash
npx tsc --noEmit         # Type check without emitting files
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **State Management**: React hooks with URL state management
- **Charts**: ApexCharts with React wrapper
- **PDF**: React PDF renderer for reports

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (home)/            # Dashboard home with role-based routing
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin-only pages
│   ├── principal/         # Principal-only pages
│   └── [other pages]      # Public and utility pages
├── components/            # Reusable components
│   ├── Layouts/           # Header, sidebar, navigation
│   ├── Tables/            # Data tables with pagination
│   ├── ui/                # Base UI components (Button, Card, etc.)
│   └── Loading/           # Loading states and skeletons
├── lib/                   # Utility libraries and services
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Database client
│   ├── audit.ts          # Audit logging service
│   ├── attendance-policy.ts # Attendance policy logic
│   └── [other utilities] # Various helper functions
├── types/                 # TypeScript type definitions
└── generated/prisma/      # Auto-generated Prisma types
```

### Key Architectural Patterns

#### Role-Based Access Control
- Three user roles: ADMIN, TEACHER, PRINCIPAL
- Role-based sidebar navigation (`RoleBasedSidebar` component)
- Route protection through middleware and session checks
- Profile-specific data relations (TeacherProfile, PrincipalProfile)

#### Database Schema
- **User Management**: Users with role-based profiles
- **School Structure**: Schools → Classes → Students hierarchy
- **Teacher Management**: Assignments, wages, curriculum topics
- **Attendance System**: Lessons with attendance tracking and policies
- **Payment System**: School payments and teacher wage records
- **Audit Trail**: Comprehensive audit logging for all operations

#### Authentication Flow
- NextAuth.js with credentials provider
- JWT-based sessions with role information
- Password hashing with bcryptjs
- Session-based route protection

#### State Management
- URL-based state management for filters and selections
- React hooks for local component state
- Server-side data fetching with proper loading states

## Database Models

### Core Entities
- **User**: Base user with role-based profiles
- **School**: Academy/school with districts and classes
- **Class**: Subject-specific classes with students
- **Student**: Students assigned to classes
- **TeacherProfile**: Teacher profiles with specializations and wages
- **PrincipalProfile**: Principals assigned to schools
- **Lesson**: Individual teaching sessions with attendance

### Supporting Systems
- **Attendance**: Student attendance tracking with policies
- **Curriculum**: Topics and lesson planning
- **Payments**: School fees and teacher wages
- **Audit**: Comprehensive audit logging
- **Configuration**: System-wide settings

## Component Patterns

### UI Components
- Base components in `src/components/ui/` (Button, Card, Dropdown, Table, etc.)
- Responsive design with Tailwind breakpoints
- Dark mode support via next-themes
- Loading skeletons for better UX

### Layout Components
- `RoleBasedSidebar`: Dynamic sidebar based on user role
- `Header`: App header with user info and notifications
- Error boundaries for graceful error handling

### Data Tables
- Server-side pagination and filtering
- Search state managed through URL parameters
- Skeleton loading states
- Export functionality for reports

## Authentication & Authorization

### Session Structure
```typescript
{
  user: {
    id: string,
    role: UserRole,
    username: string,
    firstName: string,
    lastName: string,
    teacherProfile?: TeacherProfile,
    principalProfile?: PrincipalProfile
  }
}
```

### Route Protection
- Middleware for authentication checks
- Role-based page access
- Session timeout handling
- Password reset flow with tokens

## Environment Configuration

### Required Environment Variables
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NODE_ENV=development
```

## Development Notes

### Code Style
- TypeScript strict mode enabled
- ESLint with Next.js configuration
- Prettier with Tailwind plugin
- Component-based architecture with proper separation of concerns

### Database Changes
- Always update schema in `prisma/schema.prisma`
- Run `npx prisma generate` after schema changes
- Use `npx prisma db push` for development
- Create migrations for production changes

### Testing
- Currently no automated tests (gap in implementation)
- Manual testing through development server
- Database seeding with `scripts/seed.ts`

### Performance
- Next.js 15 with App Router for optimal performance
- Server-side rendering where appropriate
- Optimized images through Next.js Image component
- Code splitting through dynamic imports