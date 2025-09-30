# User Profile System Architecture

## Executive Summary

This document outlines the comprehensive user profile system architecture for the Godo React Native app, designed to seamlessly integrate with the existing event discovery platform while providing robust user management, settings, and personalization capabilities.

## Current Architecture Analysis

### Existing Structure
- **Navigation**: Bottom Tab Navigator (`DiscoverScreen`, `MyEventsScreen`)
- **State Management**: Local React hooks with singleton `EventService`
- **Storage**: In-memory singleton pattern (no persistence)
- **Styling**: Design tokens system (colors, typography, spacing)
- **Backend**: FastAPI with Supabase, JWT authentication, comprehensive user models

### Key Findings
1. **Scalability Gap**: Current singleton pattern won't scale for user-specific data
2. **No Authentication Flow**: Frontend lacks auth integration despite backend readiness
3. **Missing Persistence**: No local storage for user preferences or offline capability
4. **Limited State Management**: No centralized user state management

## User Profile System Design

### 1. Data Model & Types

#### Extended User Types
```typescript
// Extend existing User interface
export interface UserProfile extends User {
  displayName: string;
  avatar?: string;
  bio?: string;
  joinedDate: Date;
  isOnline: boolean;
  lastSeen?: Date;
  socialLinks?: SocialLinks;
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  preferences: UserPreferences;
  accessibility: AccessibilitySettings;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  eventReminders: boolean;
  friendActivity: boolean;
  marketingEmails: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  locationSharing: boolean;
  activityStatus: boolean;
  eventAttendanceVisibility: 'public' | 'friends' | 'private';
}

export interface UserPreferences {
  categories: EventCategory[];
  neighborhoods: string[];
  priceRange: { min: number; max: number };
  timePreferences: TimePreference[];
  groupSizePreference: 'small' | 'medium' | 'large' | 'any';
}
```

### 2. Storage Architecture

#### Three-Tier Storage Strategy
```typescript
// Local Storage (AsyncStorage)
export class LocalUserStorage {
  // User profile cache
  static async cacheUserProfile(user: UserProfile): Promise<void>
  static async getCachedUserProfile(): Promise<UserProfile | null>
  
  // Settings persistence
  static async saveSettings(settings: UserSettings): Promise<void>
  static async getSettings(): Promise<UserSettings | null>
  
  // Authentication tokens
  static async saveTokens(tokens: AuthTokens): Promise<void>
  static async getTokens(): Promise<AuthTokens | null>
}

// Cloud Storage (Supabase Integration)
export class CloudUserStorage {
  // Profile synchronization
  static async syncProfile(profile: UserProfile): Promise<void>
  static async fetchProfile(userId: string): Promise<UserProfile>
  
  // Settings backup
  static async backupSettings(settings: UserSettings): Promise<void>
  static async restoreSettings(userId: string): Promise<UserSettings>
}

// Hybrid Storage Manager
export class UserStorageManager {
  // Offline-first with cloud sync
  static async saveProfile(profile: UserProfile): Promise<void>
  static async getProfile(): Promise<UserProfile | null>
  static async syncWhenOnline(): Promise<void>
}
```

### 3. Authentication & Authorization Patterns

#### JWT-Based Authentication Flow
```typescript
// Authentication Service
export class AuthService {
  private static instance: AuthService;
  private tokens: AuthTokens | null = null;
  
  // Core authentication methods
  async login(credentials: LoginCredentials): Promise<AuthResult>
  async register(userData: RegistrationData): Promise<AuthResult>
  async logout(): Promise<void>
  async refreshToken(): Promise<string>
  
  // Token management
  async getValidToken(): Promise<string | null>
  async isAuthenticated(): Promise<boolean>
  
  // Profile integration
  async getCurrentUser(): Promise<UserProfile | null>
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile>
}

// Authorization Patterns
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) return <LoadingScreen />;
    if (!isAuthenticated) return <LoginScreen />;
    
    return <Component {...props} />;
  };
};
```

### 4. Navigation & UI Structure

#### Enhanced Navigation Architecture
```typescript
// Root Navigator with Authentication
export const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <SplashScreen />;
  
  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

// Authenticated Navigation Stack
export const AuthenticatedNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Discover" component={DiscoverScreen} />
    <Tab.Screen name="MyEvents" component={MyEventsScreen} />
    <Tab.Screen name="Profile" component={ProfileNavigator} />
  </Tab.Navigator>
);

// Profile Stack Navigator
export const ProfileNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Preferences" component={PreferencesScreen} />
    <Stack.Screen name="Privacy" component={PrivacySettingsScreen} />
    <Stack.Screen name="Notifications" component={NotificationSettingsScreen} />
  </Stack.Navigator>
);
```

### 5. State Management Approach

#### React Context API Architecture
```typescript
// Auth Context
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Authentication methods
  const login = async (credentials: LoginCredentials) => { /* ... */ };
  const logout = async () => { /* ... */ };
  const updateProfile = async (updates: Partial<UserProfile>) => { /* ... */ };
  
  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, loading,
      login, logout, updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Settings Context
export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  
  // Settings methods
  const updateSettings = async (updates: Partial<UserSettings>) => { /* ... */ };
  const resetSettings = async () => { /* ... */ };
  
  return (
    <SettingsContext.Provider value={{
      settings, loading,
      updateSettings, resetSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom Hooks
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
```

## Architecture Decision Records (ADRs)

### ADR-001: State Management Pattern
**Decision**: Use React Context API instead of Redux or Zustand
**Rationale**: 
- Lightweight for current app scope
- No additional dependencies
- Sufficient for user profile state complexity
- Easy integration with existing architecture

### ADR-002: Storage Strategy
**Decision**: Hybrid local-first with cloud sync
**Rationale**:
- Offline functionality essential for mobile
- AsyncStorage for local persistence
- Supabase integration for cloud backup
- Eventual consistency model

### ADR-003: Authentication Pattern
**Decision**: JWT tokens with automatic refresh
**Rationale**:
- Stateless authentication
- Secure token rotation
- Compatible with existing backend
- Standard mobile app pattern

### ADR-004: Navigation Architecture
**Decision**: Stack Navigator within Tab Navigator
**Rationale**:
- Natural mobile UX
- Profile flows need stack navigation
- Maintains existing tab structure
- Scalable for future features

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. **Context Providers Setup**
   - Create AuthProvider and SettingsProvider
   - Implement custom hooks
   - Set up type definitions

2. **Navigation Structure**
   - Add Profile tab to TabNavigator
   - Create ProfileNavigator stack
   - Implement route guards

3. **Basic Storage Layer**
   - AsyncStorage utilities
   - Token management
   - Basic persistence

### Phase 2: Core Features (Week 3-4)
1. **Authentication Flow**
   - Login/Register screens
   - Token management
   - Auto-login functionality

2. **Profile Management**
   - Profile screen UI
   - Edit profile functionality
   - Avatar management

3. **Settings System**
   - Settings categories
   - Preference management
   - Notification controls

### Phase 3: Integration (Week 5-6)
1. **Backend Integration**
   - API service layer
   - Data synchronization
   - Error handling

2. **Advanced Features**
   - Offline support
   - Data migration
   - Performance optimization

## File Structure

```
src/
├── contexts/
│   ├── AuthContext.tsx
│   ├── SettingsContext.tsx
│   └── index.ts
├── screens/
│   └── profile/
│       ├── ProfileScreen.tsx
│       ├── EditProfileScreen.tsx
│       ├── SettingsScreen.tsx
│       ├── PreferencesScreen.tsx
│       └── index.ts
├── services/
│   ├── auth/
│   │   ├── AuthService.ts
│   │   ├── TokenManager.ts
│   │   └── index.ts
│   └── storage/
│       ├── LocalStorage.ts
│       ├── CloudStorage.ts
│       └── StorageManager.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useSettings.ts
│   └── useProfile.ts
├── components/
│   └── profile/
│       ├── ProfileHeader.tsx
│       ├── SettingsItem.tsx
│       ├── PreferenceToggle.tsx
│       └── index.ts
└── types/
    ├── auth.ts
    ├── profile.ts
    └── settings.ts
```

## Quality Attributes

### Performance
- Lazy loading for profile screens
- Optimized image caching for avatars
- Efficient state updates with React.memo

### Security
- Secure token storage
- Input validation
- Privacy controls
- Data encryption for sensitive information

### Scalability
- Modular architecture
- Extensible settings system
- Plugin-ready for future features
- Clean separation of concerns

### Reliability
- Offline-first design
- Graceful error handling
- Data consistency checks
- Automatic retry mechanisms

## Risk Mitigation

### Technical Risks
1. **State Management Complexity**: Context API limitations at scale
   - *Mitigation*: Consider Redux migration path if needed
2. **Storage Conflicts**: AsyncStorage race conditions
   - *Mitigation*: Implement proper locking mechanisms
3. **Authentication Issues**: Token expiration handling
   - *Mitigation*: Robust refresh token flow

### UX Risks
1. **Navigation Complexity**: Too many profile screens
   - *Mitigation*: User testing and iterative design
2. **Settings Overload**: Too many configuration options
   - *Mitigation*: Progressive disclosure and smart defaults

## Integration Guidelines

### For Development Teams
1. **Context Usage**: Always use provided hooks, never direct context access
2. **Storage Pattern**: Use StorageManager for all user data operations
3. **Navigation**: Follow established screen naming conventions
4. **Type Safety**: Leverage TypeScript for all profile-related operations

### For Future Features
1. **Social Features**: User profile system ready for social integration
2. **Personalization**: Preference system extensible for ML recommendations
3. **Analytics**: User interaction tracking built into contexts
4. **Monetization**: Settings structure supports subscription tiers

This architecture provides a robust foundation for user profile management while maintaining compatibility with the existing Godo app structure and preparing for future feature expansions.