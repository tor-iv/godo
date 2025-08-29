# User Profile Testing Suite

A comprehensive testing framework for the user profile functionality in the Godo app, ensuring 90%+ test coverage with robust validation, accessibility, and integration testing.

## 📁 Test Structure

```
tests/
├── setup.js                       # Jest configuration and global mocks
├── mocks/
│   └── userMocks.js               # Comprehensive user data factories
├── unit/                          # Unit tests for individual components
│   ├── components/
│   │   └── UserProfile.test.tsx   # Profile component tests
│   ├── services/
│   │   └── UserService.test.ts    # Business logic tests
│   ├── validation/
│   │   └── UserValidation.test.ts # Data validation tests
│   └── accessibility/
│       └── ProfileAccessibility.test.tsx # WCAG compliance tests
├── integration/                   # Integration and flow tests
│   ├── auth/
│   │   └── AuthenticationFlow.test.tsx # Auth flow tests
│   ├── api/
│   │   └── UserAPI.test.ts        # API endpoint tests
│   └── navigation/
│       └── ProfileNavigation.test.tsx # Navigation tests
└── utils/
    └── testRunner.js              # Custom test runner with coverage
```

## 🧪 Test Categories

### 1. Unit Tests
- **UserProfile.test.tsx**: Component rendering, props handling, edge cases
- **UserService.test.ts**: Business logic, caching, validation
- **UserValidation.test.ts**: Input validation, sanitization, security

### 2. Integration Tests  
- **AuthenticationFlow.test.tsx**: Login, registration, logout flows
- **UserAPI.test.ts**: HTTP endpoints, error handling, authentication
- **ProfileNavigation.test.tsx**: Route transitions, parameter passing

### 3. Accessibility Tests
- **ProfileAccessibility.test.tsx**: Screen reader support, WCAG compliance, keyboard navigation

## 🚀 Running Tests

### Quick Start
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration  
npm run test:accessibility
npm run test:validation

# Generate coverage report
npm run test:coverage

# Validate coverage requirements
npm run test:coverage:validate

# Watch mode for development
npm run test:watch
```

### Advanced Commands
```bash
# Run specific test files
npm test UserProfile
npm test "auth/**"

# Debug mode (verbose output, bail on first failure)  
npm test debug UserService

# Update snapshots
npm test update

# Generate HTML coverage report
npm test coverage
```

## 📊 Coverage Requirements

### Global Coverage Targets
- **Branches**: 75%
- **Functions**: 80%  
- **Lines**: 80%
- **Statements**: 80%

### Critical Components (Higher Requirements)
- **UserService**: 90% across all metrics
- **UserProfile Component**: 85% across all metrics
- **Authentication Flow**: 85% across all metrics

## 🏗️ Test Configuration

### Jest Configuration (`jest.config.js`)
- React Native preset with Expo compatibility
- Custom module mapping for absolute imports
- Transform ignore patterns for node_modules
- Coverage collection from `src/` directory
- HTML and LCOV coverage reporters

### Mock Setup (`tests/setup.js`)
- React Navigation mocks
- React Native Reanimated mocks
- Gesture Handler mocks
- AsyncStorage mocks
- Global test utilities

## 📝 Mock Data Factories

The `userMocks.js` provides comprehensive factories for:

- **createMockUser()**: Complete user objects
- **createMockUserCreate()**: Registration data
- **createMockUserUpdate()**: Profile update data
- **createMockAuthToken()**: Authentication tokens
- **invalidUserData**: Invalid inputs for validation testing
- **mockAPIResponses**: HTTP response mocks

## 🔍 Test Features

### Component Testing
- Props validation and rendering
- User interaction simulation
- Edge case handling (null/undefined data)
- Error boundary testing
- State management validation

### API Testing
- HTTP endpoint validation
- Authentication header handling
- Error response processing
- Network timeout simulation
- Rate limiting scenarios

### Navigation Testing
- Route parameter passing
- Navigation state management
- Deep linking support
- Back navigation handling
- Error route recovery

### Accessibility Testing
- Screen reader compatibility
- Keyboard navigation support
- WCAG 2.1 compliance validation
- Focus management
- Accessibility announcements

### Security Testing
- Input sanitization validation
- XSS prevention testing
- Authentication token handling
- Password strength validation
- Data privacy compliance

## 🛠️ Custom Test Runner

The `testRunner.js` utility provides:

- **Suite Management**: Run specific test categories
- **Coverage Validation**: Enforce coverage thresholds
- **Report Generation**: HTML and console reports
- **Watch Mode**: Development-friendly test watching
- **Debug Support**: Verbose logging and error tracing

## 📋 Test Guidelines

### Writing Tests
1. **Descriptive Names**: Use clear, specific test descriptions
2. **Arrange-Act-Assert**: Structure tests with clear sections
3. **Edge Cases**: Test boundary conditions and error states  
4. **Mocking**: Mock external dependencies appropriately
5. **Accessibility**: Include accessibility validation
6. **Coverage**: Aim for meaningful, not just statistical coverage

### Best Practices
- Use `beforeEach()` for test isolation
- Mock external services and APIs
- Test user interactions, not implementation details
- Include positive and negative test cases
- Validate error messages and states
- Test accessibility attributes and behavior

## 🐛 Debugging Tests

### Common Issues
1. **Module Resolution**: Check Jest moduleNameMapping
2. **Mock Problems**: Verify mock setup in setup.js
3. **Async Issues**: Use waitFor() for async operations
4. **Navigation**: Ensure proper navigation mocking
5. **Timers**: Use Jest fake timers for time-based code

### Debug Commands
```bash
# Verbose output with debug info
npm test debug [pattern]

# Run single test file
npm test -- --testPathPattern=UserProfile

# Update failing snapshots  
npm test -- --updateSnapshot

# Run with coverage and open report
npm run test:coverage && open coverage/lcov-report/index.html
```

## 📈 Coverage Reports

### HTML Report
Generated at `coverage/lcov-report/index.html` with:
- File-by-file coverage breakdown
- Line-by-line coverage highlighting  
- Branch coverage visualization
- Function coverage tracking

### Console Report  
Real-time coverage feedback during test runs with:
- Summary statistics
- Threshold validation
- Coverage trends
- Missing coverage identification

## 🔧 Continuous Integration

The test suite supports CI/CD with:
- **Coverage Enforcement**: Automatic failure on low coverage
- **Parallel Execution**: Optimized for CI environments
- **Report Generation**: Structured output for CI dashboards
- **Flake Detection**: Retry mechanisms for unstable tests

## 🚀 Performance

### Test Execution Speed
- **Unit Tests**: < 2 seconds per test file
- **Integration Tests**: < 5 seconds per test file
- **Full Suite**: < 30 seconds total
- **Coverage Generation**: Additional 10-15 seconds

### Optimization Features
- Jest worker parallelization
- Transform caching
- Selective test running
- Mock optimization
- Memory usage monitoring

---

This comprehensive test suite ensures the user profile functionality is thoroughly validated, accessible, secure, and maintainable. All tests follow industry best practices and provide meaningful coverage that catches real-world issues.

For questions or contributions, refer to the individual test files for specific implementation details and examples.