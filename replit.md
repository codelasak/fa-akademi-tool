# NextAdmin - Next.js Dashboard

## Overview
NextAdmin is a comprehensive Next.js admin dashboard template with 200+ UI components and templates. The application is now fully configured to run in the Replit environment.

## Project Architecture
- **Framework**: Next.js 15.1.6 with React 19.0.0
- **Styling**: Tailwind CSS with custom theme
- **UI Components**: Pre-built admin dashboard components
- **Charts**: ApexCharts integration for data visualization
- **Language**: TypeScript
- **Routing**: Next.js App Router with organized page structure

## Current Setup Status
- ✅ Dependencies installed
- ✅ Next.js configured for Replit environment
- ✅ Development server running on port 5000
- ✅ Deployment configuration set for autoscale
- ✅ Application tested and working

## Development
- Server runs on port 5000 with host 0.0.0.0
- Cache control headers configured for development
- All hosts allowed for Replit proxy compatibility

## Deployment
- Build command: `npm run build`
- Start command: `npm start`
- Target: Autoscale (stateless)

## Architecture Notes
The project follows Next.js App Router conventions with:
- Organized component structure in `/src/components`
- Page routing in `/src/app`
- Custom Tailwind configuration with extensive theme
- Type definitions and utilities in `/src/types` and `/src/lib`

## Recent Changes (September 15, 2025)
- Configured Next.js for Replit environment compatibility
- Set up development workflow on port 5000
- Configured deployment settings for production
- Project successfully imported and running