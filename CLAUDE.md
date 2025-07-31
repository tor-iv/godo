# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "godo" - an event discovery app for young professionals in NYC that helps users get off their phones and discover local events. The app uses a Tinder-like swipe interface to browse curated events and build personalized calendars with social features.

## Technology Stack

- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Python (to be implemented)
- **Database**: Supabase
- **Navigation**: React Navigation 6 (Bottom Tabs + Stack)
- **State Management**: TanStack Query (React Query)
- **Animations**: React Native Reanimated 3
- **Gestures**: React Native Gesture Handler

## Project Structure

The app follows a feature-based directory structure:

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components
│   └── events/          # Event-specific components
├── screens/             # Screen components
│   ├── auth/            # Authentication screens
│   ├── discover/        # Main discovery feed
│   └── calendar/        # Calendar and saved events
├── navigation/          # Navigation configuration
├── services/            # API and external service integration
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── constants/           # App constants (colors, fonts, etc.)
```

## Development Commands

Since this is an Expo React Native project, use these commands:

- **Start development server**: `npx expo start`
- **Run on iOS simulator**: `npx expo start` then press `i`
- **Run on Android**: `npx expo start` then press `a`
- **Clear Metro cache**: `npx expo start --clear`
- **Type checking**: `npx tsc --noEmit`
- **Linting**: `npx eslint src/`
- **Install dependencies**: `npm install` or `npx expo install [package]`

## Core App Features

### Swipe Mechanics
- **Right Swipe**: "Private Calendar" - adds event to private calendar
- **Left Swipe**: "Not interested" - removes from feed
- **Up Swipe**: "Public Calendar" - adds event to public calendar
- **Down Swipe**: "Save for later" - saves for later viewing

### Feed Modes
- **Happening Now**: Current and today's events
- **Planning Ahead**: Future events for planning

### Navigation Structure
- **Tab 1 "Discover"**: Main event feed with swipe interface
- **Tab 2 "My Events"**: Personal calendar and saved collections

## Key Design Principles

### Color Scheme
- Primary: Purple (#8B5CF6)
- Secondary: Light Purple (#A78BFA)
- Background: White/Off-white
- Text: Dark purple on white backgrounds

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Path mapping configured for clean imports (@/components/*, @/screens/*, etc.)
- All new code should use proper TypeScript types

### Performance Requirements
- 60fps animations for card swiping
- Optimized image loading and caching
- Smooth transitions between feed modes

## Development Setup Status

Based on the setup guide, the project structure includes:
1. Expo TypeScript configuration
2. Navigation setup (Tab + Stack navigators)
3. Core type definitions for events, users, and swipe actions
4. Basic screen components with purple theme
5. Constants for colors, fonts, spacing, and animations

The project is currently in initial setup phase with placeholder screens and basic navigation structure in place.