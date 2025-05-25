# KibaStack Auth

A clean, modern authentication and team management platform built with TypeScript, Hono, and Drizzle ORM.

## Features

- **User Authentication**: Email/password registration, login, logout
- **OAuth Integration**: GitHub and Google OAuth support
- **Password Management**: Secure password resets with email verification
- **Team Management**: Multi-tenant team system with role-based permissions
- **Team Memberships**: Invite and manage team members with different roles
- **Background Jobs**: BullMQ-powered job queue for email sending and processing
- **Email System**: Transactional email support for notifications and verification
- **Modern Stack**: Built with Hono, Drizzle ORM, MySQL, Redis, and BullMQ

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- MySQL 8.0+
- Redis

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kibastack
```

2. Install dependencies:
```bash
npm install
```

3. Start the databases:
```bash
docker compose -f docker/compose.databases.yaml up -d
```

4. Set up your environment variables (copy from `.env.example`)

5. Run database migrations:
```bash
npm run cli reset-database
```

6. Start the development server and worker:
```bash
npm run dev
npm run worker:dev
```

Or use PM2 to run both:
```bash
npm run pm2:dev
```

## Architecture

This is a clean authentication platform with the following core modules:

- **Auth**: User registration, login, OAuth, password resets
- **Teams**: Multi-tenant team management
- **Team Memberships**: Role-based team member management
- **Worker System**: Background job processing with BullMQ
- **Email Jobs**: Automated email sending for verification and notifications
- **Database**: MySQL with Drizzle ORM
- **Cache**: Redis for sessions and job queues
- **Frontend**: Server-side rendered pages with modern UI components

## Database Schema

The core database schema includes:

- `users` - User accounts and authentication data
- `oauth2Accounts` - OAuth provider connections
- `passwordResets` - Password reset tokens
- `teams` - Team/organization entities
- `teamMemberships` - User-team relationships with roles

## Contributing

This is a clean, focused authentication platform. When contributing:

1. Keep features authentication and team-management focused
2. Maintain the clean architecture
3. Follow TypeScript best practices
4. Write tests for new functionality

## License

ISC
