# BitJackz Crypto Casino Web App

## Overview

This is a full-stack crypto casino web application built to run seamlessly on both desktop and mobile devices, with Telegram WebApp integration in mind. The application features a modern, dark-themed UI inspired by platforms like Jeton, Rubet, and Stake, with six casino games implemented in the first phase. The app is branded as "BitJackz" and includes the official BitJackz logo throughout the interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Custom CSS variables for theming with dark mode support

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: In-memory storage for development (designed for Redis/PostgreSQL in production)
- **API Design**: RESTful JSON endpoints
- **Development Server**: Hot reload with Vite integration

### Monorepo Structure
```
/client          # React frontend
/server          # Express backend
/shared          # Shared types and schemas
/migrations      # Database migrations
```

## Key Components

### Games Implementation
Six casino games are fully implemented:
1. **Crash Game** - Rising multiplier with cash-out mechanics
2. **Coin Flip** - Simple heads/tails 50/50 game
3. **Limbo** - Multiplier prediction game
4. **Dice** - Over/under number prediction
5. **Mines** - Minesweeper-style tile revealing
6. **Roulette** - Classic roulette with simplified betting

### Database Schema
- **Users Table**: Stores user credentials and balance
- **Game Results Table**: Tracks all game outcomes and payouts
- **Shared Validation**: Zod schemas for type-safe data validation across frontend and backend

### UI Components
- **Game Tiles**: Interactive cards with hover effects and animations
- **Top Navigation**: Balance display, wallet functionality, mobile-optimized
- **Wallet Page**: Full deposit/withdraw functionality with transaction history
- **Responsive Design**: Mobile-first approach with Telegram WebApp compatibility
- **Toast Notifications**: Real-time feedback for game results and transactions
- **Modal System**: Simplified wallet modal that redirects to full wallet page

## Data Flow

1. **User Authentication**: Individual Telegram user verification with session management
2. **Game Play**: Frontend sends bet data to backend, backend processes game logic and returns results
3. **Balance Updates**: Real-time balance updates after each game for specific user
4. **Game History**: Recent games displayed on homepage with live statistics

## External Dependencies

### Frontend Dependencies
- **UI Libraries**: Radix UI primitives, Lucide React icons
- **State Management**: TanStack Query for API calls
- **Styling**: Tailwind CSS, class-variance-authority
- **Forms**: React Hook Form with Zod validation

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)
- **Validation**: Zod for schema validation
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Vite**: Development server with HMR
- **TypeScript**: Full type safety across the stack
- **ESLint**: Code quality and consistency
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Development
- Frontend runs on port 5173 (Vite dev server)
- Backend runs on port 3000 (Express server)
- Database: PostgreSQL via Neon or local instance
- Hot reload enabled for both frontend and backend

### Production
- Frontend: Static build served by Express
- Backend: Compiled TypeScript with esbuild
- Database: PostgreSQL with connection pooling
- Environment variables for configuration

### Build Process
1. `npm run build` - Builds frontend and backend
2. `npm run start` - Runs production server
3. `npm run db:push` - Applies database schema changes

## Changelog
- July 03, 2025. Initial setup with 6 casino games and dark theme
- July 03, 2025. Removed statistics display per user request
- July 03, 2025. Added BitJackz branding and logo integration
- July 03, 2025. Started database integration (PostgreSQL setup)
- July 05, 2025. Enhanced mobile compatibility and removed user button
- July 05, 2025. Added Telegram WebApp optimizations and touch interactions
- July 05, 2025. Added wallet page with deposit/withdraw functions and set initial balance to $0
- July 05, 2025. Implemented Telegram user verification system and wallet transaction management
- July 05, 2025. Added individual user account system with session-based authentication across all endpoints

## User Preferences

Preferred communication style: Simple, everyday language.
Branding: BitJackz logo and name throughout the app.
Statistics: No statistics display wanted on homepage.