# Cline Rules - Event Discovery App

## Project Overview
React Native (Expo) event discovery app with Tinder-like swiping for NYC young professionals. Purple and white branding. Supabase backend with Python APIs.

## Rules File Structure
This project uses modular rules files for different development areas. Always reference the appropriate file based on the task:

### Frontend Development
**File**: `.cline/frontend-rules.md`
**Use when**: Working on React Native components, screens, styling, animations, navigation
**Covers**: Component patterns, React Native specifics, UI/UX, styling guidelines, TypeScript usage

### Backend Development  
**File**: `.cline/backend-rules.md`
**Use when**: Working on Supabase schema, Python APIs, database operations, authentication
**Covers**: Database design, API patterns, security, data validation

### Testing & QA
**File**: `.cline/testing-rules.md`
**Use when**: Writing tests, debugging, performance optimization, code quality
**Covers**: Testing strategies, debugging approaches, performance guidelines

### Deployment & DevOps
**File**: `.cline/deployment-rules.md`
**Use when**: Setting up builds, app store preparation, environment configuration
**Covers**: Build processes, deployment strategies, monitoring, CI/CD

## Core Project Rules (Always Apply)

### Tech Stack
- **Frontend**: React Native with Expo SDK 51+
- **Backend**: Supabase + Python APIs
- **Language**: TypeScript preferred
- **Styling**: React Native StyleSheet only

### Naming Conventions
- Components: PascalCase (EventCard, DiscoverScreen)
- Files: PascalCase matching component name
- Variables/functions: camelCase (handleSwipe, eventData)
- Constants: UPPER_SNAKE_CASE (SWIPE_DIRECTIONS, COLORS)
- Database tables: snake_case (user_swipes, event_categories)

### Color Scheme (Purple & White Theme)
```typescript
const COLORS = {
  PRIMARY_PURPLE: '#6B46C1',
  SECONDARY_PURPLE: '#8B5CF6', 
  LIGHT_PURPLE: '#E5D3FF',
  WHITE: '#FFFFFF',
  DARK_TEXT: '#1F2937',
  BACKGROUND: '#F9FAFB'
};
```

### Core App Features
- **Swipe Mechanics**:
  - Right: "Want to go" (save to calendar)
  - Left: "Not interested" (dismiss)  
  - Up: "Save for later" (saved stack)
  - Down: "Like but can't go" (sharing collection)
- **Navigation**: 2-tab layout (Discover, My Events)
- **Target Users**: NYC young professionals
- **Event Focus**: Daytime events initially, nightlife later

## File Organization
```
.cline/
  frontend-rules.md     # React Native development rules
  backend-rules.md      # Supabase/Python development rules  
  testing-rules.md      # Testing and QA guidelines
  deployment-rules.md   # Build and deployment rules

src/
  components/
    common/             # Reusable components
    events/            # Event-specific components
  screens/
    auth/              # Authentication screens
    discover/          # Main feed screens
    calendar/          # Calendar and saved events
  services/            # API calls and business logic
  types/               # TypeScript type definitions
  utils/               # Helper functions
  constants/           # App constants and config
```

## Development Phases
1. **Sprint 1 (Days 1-3)**: Core foundation (auth, navigation, basic swiping)
2. **Sprint 2 (Days 4-6)**: Calendar integration and event management  
3. **Sprint 3 (Days 7-9)**: Social features foundation
4. **Sprint 4 (Days 10-12)**: External integrations and beta prep

## Quick Reference
- **Current Phase**: [Update based on development progress]
- **Priority Features**: Core swiping, calendar integration, friend indicators
- **Key Dependencies**: react-native-gesture-handler, react-native-reanimated, @supabase/supabase-js

---

**Always check the specific rules file for the type of work you're doing. When in doubt about which file to reference, ask the developer to clarify the task type.**