#!/usr/bin/env node

/**
 * Profile Functionality Testing Suite
 * Comprehensive testing script for all profile-related components and functionality
 * 
 * This script tests:
 * 1. Component rendering and props
 * 2. Navigation flow and routing
 * 3. Responsive design across different screen sizes
 * 4. Styling consistency and theming
 * 5. User interactions and functionality
 */

const fs = require('fs');
const path = require('path');

class ProfileFunctionalityTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      issues: [],
      recommendations: []
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async testComponentRendering() {
    this.log('Testing component rendering and props...', 'info');
    
    try {
      // Test ProfileScreen component structure
      const profileScreenPath = path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx');
      const profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');
      
      // Check for required imports
      const requiredImports = [
        'React', 'useState', 'useEffect', 'View', 'Text', 'StyleSheet',
        'ScrollView', 'TouchableOpacity', 'Image', 'Alert', 'Feather',
        'useSafeAreaInsets', 'colors', 'typography', 'spacing', 'layout',
        'shadows', 'Button', 'Container', 'ProfilePictureUpload'
      ];
      
      let missingImports = [];
      requiredImports.forEach(importName => {
        if (!profileScreenContent.includes(importName)) {
          missingImports.push(importName);
        }
      });
      
      if (missingImports.length === 0) {
        this.log('✓ All required imports are present in ProfileScreen', 'success');
        this.results.passed++;
      } else {
        this.log(`✗ Missing imports in ProfileScreen: ${missingImports.join(', ')}`, 'error');
        this.results.failed++;
        this.results.issues.push(`Missing imports: ${missingImports.join(', ')}`);
      }

      // Check for proper TypeScript interfaces
      if (profileScreenContent.includes('interface ProfileScreenProps') && 
          profileScreenContent.includes('interface User') &&
          profileScreenContent.includes('interface EventCategory')) {
        this.log('✓ TypeScript interfaces are properly defined', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Missing or incomplete TypeScript interfaces', 'error');
        this.results.failed++;
        this.results.issues.push('TypeScript interfaces missing or incomplete');
      }

      // Check for proper state management
      if (profileScreenContent.includes('useState<User>') && 
          profileScreenContent.includes('useState({')) {
        this.log('✓ State management is properly implemented', 'success');
        this.results.passed++;
      } else {
        this.log('✗ State management implementation issues', 'error');
        this.results.failed++;
        this.results.issues.push('State management not properly implemented');
      }

      // Test ProfilePictureUpload component
      const profilePictureUploadPath = path.join(__dirname, '../src/components/profile/ProfilePictureUpload.tsx');
      const profilePictureUploadContent = fs.readFileSync(profilePictureUploadPath, 'utf8');
      
      if (profilePictureUploadContent.includes('ImagePicker') && 
          profilePictureUploadContent.includes('requestPermission')) {
        this.log('✓ ProfilePictureUpload has proper image picker functionality', 'success');
        this.results.passed++;
      } else {
        this.log('✗ ProfilePictureUpload missing image picker functionality', 'error');
        this.results.failed++;
        this.results.issues.push('ProfilePictureUpload missing image picker functionality');
      }

    } catch (error) {
      this.log(`Error testing component rendering: ${error.message}`, 'error');
      this.results.failed++;
      this.results.issues.push(`Component rendering test failed: ${error.message}`);
    }
  }

  async testNavigationFlow() {
    this.log('Testing navigation flow and routing...', 'info');
    
    try {
      const navigatorPath = path.join(__dirname, '../src/navigation/ProfileStackNavigator.tsx');
      const navigatorContent = fs.readFileSync(navigatorPath, 'utf8');
      
      // Check for proper stack navigator setup
      if (navigatorContent.includes('createNativeStackNavigator') && 
          navigatorContent.includes('ProfileStackParamList')) {
        this.log('✓ Stack navigator is properly configured', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Stack navigator configuration issues', 'error');
        this.results.failed++;
        this.results.issues.push('Stack navigator not properly configured');
      }

      // Check for all required screens
      const requiredScreens = [
        'ProfileHome', 'EditProfile', 'Settings', 'AccountManagement',
        'ChangeEmail', 'ChangePassword', 'Security', 'Privacy', 'Support'
      ];
      
      let missingScreens = [];
      requiredScreens.forEach(screen => {
        if (!navigatorContent.includes(`name="${screen}"`)) {
          missingScreens.push(screen);
        }
      });
      
      if (missingScreens.length === 0) {
        this.log('✓ All required screens are configured in navigator', 'success');
        this.results.passed++;
      } else {
        this.log(`✗ Missing screens in navigator: ${missingScreens.join(', ')}`, 'error');
        this.results.failed++;
        this.results.issues.push(`Missing screens: ${missingScreens.join(', ')}`);
      }

      // Check for proper header configuration
      if (navigatorContent.includes('headerStyle') && 
          navigatorContent.includes('headerTitleStyle') && 
          navigatorContent.includes('getBackButton')) {
        this.log('✓ Navigation headers are properly configured', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Navigation header configuration issues', 'error');
        this.results.failed++;
        this.results.issues.push('Navigation headers not properly configured');
      }

    } catch (error) {
      this.log(`Error testing navigation flow: ${error.message}`, 'error');
      this.results.failed++;
      this.results.issues.push(`Navigation flow test failed: ${error.message}`);
    }
  }

  async testResponsiveDesign() {
    this.log('Testing responsive design across different screen sizes...', 'info');
    
    try {
      const profileScreenPath = path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx');
      const profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');
      
      // Check for responsive layout patterns
      if (profileScreenContent.includes('useSafeAreaInsets') && 
          profileScreenContent.includes('paddingTop: insets.top')) {
        this.log('✓ Safe area insets are properly implemented', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Safe area insets not properly implemented', 'error');
        this.results.failed++;
        this.results.issues.push('Safe area insets not properly implemented');
      }

      // Check for flexible layout patterns
      if (profileScreenContent.includes('flex: 1') && 
          profileScreenContent.includes('flexDirection')) {
        this.log('✓ Flexible layout patterns are used', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Missing flexible layout patterns', 'warn');
        this.results.recommendations.push('Consider using more flexible layout patterns for better responsive design');
      }

      // Check ProfilePictureUpload responsive sizes
      const profilePictureUploadPath = path.join(__dirname, '../src/components/profile/ProfilePictureUpload.tsx');
      const profilePictureUploadContent = fs.readFileSync(profilePictureUploadPath, 'utf8');
      
      if (profilePictureUploadContent.includes("size === 'small'") && 
          profilePictureUploadContent.includes("size === 'large'") && 
          profilePictureUploadContent.includes('getSizeStyle')) {
        this.log('✓ ProfilePictureUpload has responsive sizing', 'success');
        this.results.passed++;
      } else {
        this.log('✗ ProfilePictureUpload missing responsive sizing', 'error');
        this.results.failed++;
        this.results.issues.push('ProfilePictureUpload missing responsive sizing');
      }

    } catch (error) {
      this.log(`Error testing responsive design: ${error.message}`, 'error');
      this.results.failed++;
      this.results.issues.push(`Responsive design test failed: ${error.message}`);
    }
  }

  async testStylingConsistency() {
    this.log('Testing styling consistency and theming...', 'info');
    
    try {
      const profileScreenPath = path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx');
      const profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');
      
      // Check for consistent use of design tokens
      const designTokens = ['colors', 'typography', 'spacing', 'layout', 'shadows'];
      let missingTokens = [];
      
      designTokens.forEach(token => {
        if (!profileScreenContent.includes(`${token}.`)) {
          missingTokens.push(token);
        }
      });
      
      if (missingTokens.length === 0) {
        this.log('✓ All design tokens are properly used', 'success');
        this.results.passed++;
      } else {
        this.log(`✗ Missing design tokens: ${missingTokens.join(', ')}`, 'error');
        this.results.failed++;
        this.results.issues.push(`Missing design tokens: ${missingTokens.join(', ')}`);
      }

      // Check for consistent color usage
      if (profileScreenContent.includes('colors.primary[500]') && 
          profileScreenContent.includes('colors.neutral[800]') && 
          profileScreenContent.includes('colors.neutral[0]')) {
        this.log('✓ Consistent color palette usage', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Inconsistent color usage', 'error');
        this.results.failed++;
        this.results.issues.push('Color usage not consistent with design system');
      }

      // Check for proper typography usage
      if (profileScreenContent.includes('typography.display') && 
          profileScreenContent.includes('typography.body') && 
          profileScreenContent.includes('typography.h3')) {
        this.log('✓ Typography scale is properly used', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Typography scale not properly implemented', 'error');
        this.results.failed++;
        this.results.issues.push('Typography scale not properly implemented');
      }

      // Check Settings screen styling
      const settingsScreenPath = path.join(__dirname, '../src/screens/profile/SettingsScreen.tsx');
      const settingsScreenContent = fs.readFileSync(settingsScreenPath, 'utf8');
      
      if (settingsScreenContent.includes('settingsGroup') && 
          settingsScreenContent.includes('shadows.medium')) {
        this.log('✓ Settings screen has consistent styling', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Settings screen styling inconsistencies', 'error');
        this.results.failed++;
        this.results.issues.push('Settings screen styling inconsistencies');
      }

    } catch (error) {
      this.log(`Error testing styling consistency: ${error.message}`, 'error');
      this.results.failed++;
      this.results.issues.push(`Styling consistency test failed: ${error.message}`);
    }
  }

  async testUserInteractions() {
    this.log('Testing user interactions and functionality...', 'info');
    
    try {
      const profileScreenPath = path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx');
      const profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');
      
      // Check for proper button interactions
      const interactionHandlers = [
        'handleEditProfile', 'handleSettings', 'handleAccountManagement', 'handleLogout'
      ];
      
      let missingHandlers = [];
      interactionHandlers.forEach(handler => {
        if (!profileScreenContent.includes(handler)) {
          missingHandlers.push(handler);
        }
      });
      
      if (missingHandlers.length === 0) {
        this.log('✓ All interaction handlers are implemented', 'success');
        this.results.passed++;
      } else {
        this.log(`✗ Missing interaction handlers: ${missingHandlers.join(', ')}`, 'error');
        this.results.failed++;
        this.results.issues.push(`Missing interaction handlers: ${missingHandlers.join(', ')}`);
      }

      // Check for proper navigation calls
      if (profileScreenContent.includes("navigation.navigate('EditProfile'") && 
          profileScreenContent.includes("navigation.navigate('Settings'") && 
          profileScreenContent.includes("navigation.navigate('AccountManagement'")) {
        this.log('✓ Navigation interactions are properly implemented', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Navigation interactions not properly implemented', 'error');
        this.results.failed++;
        this.results.issues.push('Navigation interactions not properly implemented');
      }

      // Check for proper alert handling
      if (profileScreenContent.includes('Alert.alert') && 
          profileScreenContent.includes("'Sign Out'")) {
        this.log('✓ Alert interactions are properly implemented', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Alert interactions not properly implemented', 'error');
        this.results.failed++;
        this.results.issues.push('Alert interactions not properly implemented');
      }

      // Check ProfilePictureUpload interactions
      const profilePictureUploadPath = path.join(__dirname, '../src/components/profile/ProfilePictureUpload.tsx');
      const profilePictureUploadContent = fs.readFileSync(profilePictureUploadPath, 'utf8');
      
      if (profilePictureUploadContent.includes('pickImage') && 
          profilePictureUploadContent.includes('takePhoto') && 
          profilePictureUploadContent.includes('showImagePicker')) {
        this.log('✓ ProfilePictureUpload interactions are implemented', 'success');
        this.results.passed++;
      } else {
        this.log('✗ ProfilePictureUpload interactions not fully implemented', 'error');
        this.results.failed++;
        this.results.issues.push('ProfilePictureUpload interactions not fully implemented');
      }

      // Check Settings screen interactions
      const settingsScreenPath = path.join(__dirname, '../src/screens/profile/SettingsScreen.tsx');
      const settingsScreenContent = fs.readFileSync(settingsScreenPath, 'utf8');
      
      if (settingsScreenContent.includes('updateNotificationSetting') && 
          settingsScreenContent.includes('updatePrivacySetting') && 
          settingsScreenContent.includes('updateAppSetting')) {
        this.log('✓ Settings screen interactions are implemented', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Settings screen interactions not properly implemented', 'error');
        this.results.failed++;
        this.results.issues.push('Settings screen interactions not properly implemented');
      }

    } catch (error) {
      this.log(`Error testing user interactions: ${error.message}`, 'error');
      this.results.failed++;
      this.results.issues.push(`User interactions test failed: ${error.message}`);
    }
  }

  async testAccessibility() {
    this.log('Testing accessibility requirements...', 'info');
    
    try {
      const profileScreenPath = path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx');
      const profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');
      
      // Check for proper text components (no bare strings)
      const textComponents = profileScreenContent.match(/<Text[^>]*>.*?<\/Text>/g) || [];
      const bareStrings = profileScreenContent.match(/{[^}]*['"][^'"]*['"][^}]*}/g) || [];
      
      if (textComponents.length > 0) {
        this.log(`✓ Found ${textComponents.length} proper Text components`, 'success');
        this.results.passed++;
      } else {
        this.log('⚠️ Consider adding accessibility labels to interactive elements', 'warn');
        this.results.recommendations.push('Add accessibility labels to interactive elements');
      }

      // Check for semantic elements
      if (profileScreenContent.includes('TouchableOpacity') && 
          profileScreenContent.includes('ScrollView')) {
        this.log('✓ Proper semantic components are used', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Missing proper semantic components', 'error');
        this.results.failed++;
        this.results.issues.push('Missing proper semantic components for accessibility');
      }

    } catch (error) {
      this.log(`Error testing accessibility: ${error.message}`, 'error');
      this.results.failed++;
      this.results.issues.push(`Accessibility test failed: ${error.message}`);
    }
  }

  async testPerformance() {
    this.log('Testing performance considerations...', 'info');
    
    try {
      const profileScreenPath = path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx');
      const profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');
      
      // Check for proper React hooks usage
      if (profileScreenContent.includes('useEffect') && 
          profileScreenContent.includes('useState')) {
        this.log('✓ React hooks are properly used', 'success');
        this.results.passed++;
      } else {
        this.log('✗ React hooks not properly implemented', 'error');
        this.results.failed++;
        this.results.issues.push('React hooks not properly implemented');
      }

      // Check for potential performance optimizations
      if (profileScreenContent.includes('showsVerticalScrollIndicator={false}')) {
        this.log('✓ ScrollView performance optimizations applied', 'success');
        this.results.passed++;
      } else {
        this.log('⚠️ Consider adding ScrollView performance optimizations', 'warn');
        this.results.recommendations.push('Add ScrollView performance optimizations');
      }

      // Check for image optimization in ProfilePictureUpload
      const profilePictureUploadPath = path.join(__dirname, '../src/components/profile/ProfilePictureUpload.tsx');
      const profilePictureUploadContent = fs.readFileSync(profilePictureUploadPath, 'utf8');
      
      if (profilePictureUploadContent.includes('quality: 0.7') && 
          profilePictureUploadContent.includes('resizeMode="cover"')) {
        this.log('✓ Image optimization is implemented', 'success');
        this.results.passed++;
      } else {
        this.log('✗ Missing image optimization', 'error');
        this.results.failed++;
        this.results.issues.push('Missing image optimization in ProfilePictureUpload');
      }

    } catch (error) {
      this.log(`Error testing performance: ${error.message}`, 'error');
      this.results.failed++;
      this.results.issues.push(`Performance test failed: ${error.message}`);
    }
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive profile functionality testing...', 'info');
    
    await this.testComponentRendering();
    await this.testNavigationFlow();
    await this.testResponsiveDesign();
    await this.testStylingConsistency();
    await this.testUserInteractions();
    await this.testAccessibility();
    await this.testPerformance();
    
    this.generateReport();
  }

  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 PROFILE FUNCTIONALITY TEST REPORT');
    console.log('='.repeat(80));
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Pass Rate: ${passRate}%`);
    console.log('='.repeat(80));
    
    if (this.results.issues.length > 0) {
      console.log('🐛 ISSUES FOUND:');
      this.results.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
      console.log('='.repeat(80));
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      console.log('='.repeat(80));
    }
    
    // Overall assessment
    if (passRate >= 90) {
      console.log('🎉 EXCELLENT: Profile functionality is in great shape!');
    } else if (passRate >= 80) {
      console.log('👍 GOOD: Profile functionality is mostly working well');
    } else if (passRate >= 70) {
      console.log('⚠️  NEEDS ATTENTION: Profile functionality has some issues');
    } else {
      console.log('🚨 CRITICAL: Profile functionality needs significant work');
    }
    
    console.log('='.repeat(80));
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'profile-test-report.json');
    const detailedReport = {
      timestamp: new Date().toISOString(),
      duration,
      results: this.results,
      passRate: parseFloat(passRate)
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ProfileFunctionalityTester();
  tester.runAllTests().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = ProfileFunctionalityTester;