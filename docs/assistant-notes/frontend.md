# Frontend Notes

## Navigation Structure
- Root uses `NavigationContainer` + `RootNavigator` (stack) that renders `TabNavigator`.
- `TabNavigator` hosts three stacks: `Calendar`, `Discover`, `Profile`; each stack resides in `src/navigation/*StackNavigator.tsx` with feature-specific screens under `src/screens/<feature>/`.
- Ensure new screens are typed in `src/types/index.ts` (`RootStackParamList`, `CalendarStackParamList`, etc.) to keep navigation type-safe.

## State & Services
- Authentication state handled through `src/services/AuthService.ts`, which wraps `ApiService` and Supabase auth helpers (`BackendAuthService.ts`, `SwipeRepository.ts`, `EventRepository.ts`).
- `ApiService` centralizes REST calls, attaches JWT from AsyncStorage, and exposes helper methods (`signUp`, `signIn`, `healthCheck`).
- Supabase client configured in `src/config/supabase.ts` using Expo EAS public env vars; used by repositories for direct Supabase reads/writes.

## UI System
- Core design tokens in `src/design/index.ts` (colors, spacing, typography, shadows, layout constants).
- Components organized per domain (`components/calendar`, `components/events`, `components/profile`) plus shared primitives under `components/base` and form controls under `components/forms`.
- Calendaring widgets rely on `react-native-calendars`; wrappers like `DateNavigation.tsx` mediate between design system and third-party library.

## Data Layer
- `src/repositories` encapsulate Supabase queries and domain-specific data transforms (e.g., `SwipeRepository`, `EventRepository`, `AuthRepository`).
- `src/services` orchestrate repository calls and business logic (e.g., `EventService` for fetching, sorting, caching events; `SwipeInteractionTracker` for analytics).
- Sample data & seeds live in `src/data` for placeholder experiences.

## Testing & Tooling
- Jest configuration via `jest.config.js` (`tests/unit`, `tests/integration`, `tests/unit/accessibility`).
- Custom runner in `tests/utils/testRunner.js` allows targeted suites and coverage validation.
- Type safety enforced with `npm run typecheck`; linting/formatting via `npm run lint`, `npm run format`.

## Common Tasks
- Add a new API endpoint: extend `API_CONFIG.ENDPOINTS`, implement method in `ApiService`, update relevant service/repository, and wire to UI.
- Introduce a screen: update corresponding stack navigator, declare route types, create screen under `src/screens/<feature>/` using design tokens/components.
- Work with local storage: prefer `AsyncStorage` helpers already encapsulated in services; avoid duplicating key strings.
