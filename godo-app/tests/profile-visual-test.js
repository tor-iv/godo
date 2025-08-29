#!/usr/bin/env node

/**
 * Profile Visual and Integration Testing Script
 * Tests visual consistency, theming, and cross-screen integration
 */

const fs = require('fs');
const path = require('path');

class ProfileVisualTester {
  constructor() {
    this.results = {
      visualTests: { passed: 0, failed: 0, issues: [] },
      integrationTests: { passed: 0, failed: 0, issues: [] },
      themeTests: { passed: 0, failed: 0, issues: [] },
      recommendations: []
    };
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
    console.log(`${prefix} ${message}`);
  }

  async testVisualConsistency() {
    this.log('Testing visual consistency across profile components...', 'info');
    
    try {
      // Check consistent spacing patterns
      const profileScreen = fs.readFileSync(
        path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'), 'utf8'
      );
      const settingsScreen = fs.readFileSync(
        path.join(__dirname, '../src/screens/profile/SettingsScreen.tsx'), 'utf8'
      );
      
      // Check for consistent spacing usage
      const spacingPatterns = ['spacing[4]', 'spacing[6]', 'spacing[8]', 'spacing[10]'];
      let consistentSpacing = true;
      
      spacingPatterns.forEach(pattern => {
        if (profileScreen.includes(pattern) !== settingsScreen.includes(pattern)) {
          consistentSpacing = false;
        }
      });
      
      if (consistentSpacing) {
        this.log('Visual spacing is consistent across profile screens', 'success');
        this.results.visualTests.passed++;
      } else {
        this.log('Inconsistent spacing patterns between screens', 'error');
        this.results.visualTests.failed++;
        this.results.visualTests.issues.push('Inconsistent spacing patterns');
      }

      // Check for consistent border radius usage
      if (profileScreen.includes('layout.cardBorderRadius') && 
          settingsScreen.includes('layout.cardBorderRadius')) {
        this.log('Consistent border radius usage', 'success');
        this.results.visualTests.passed++;
      } else {
        this.log('Inconsistent border radius usage', 'error');
        this.results.visualTests.failed++;
        this.results.visualTests.issues.push('Inconsistent border radius');
      }

      // Check shadow consistency
      if (profileScreen.includes('shadows.medium') && 
          settingsScreen.includes('shadows.medium')) {
        this.log('Consistent shadow usage', 'success');
        this.results.visualTests.passed++;
      } else {
        this.log('Inconsistent shadow usage', 'error');
        this.results.visualTests.failed++;
        this.results.visualTests.issues.push('Inconsistent shadow usage');
      }

    } catch (error) {
      this.log(`Visual consistency test failed: ${error.message}`, 'error');
      this.results.visualTests.failed++;
    }
  }

  async testThemeCompliance() {
    this.log('Testing theme compliance and design system adherence...', 'info');
    
    try {
      const designTokensUsage = {
        colors: ['primary[500]', 'neutral[800]', 'neutral[0]', 'error[500]'],
        typography: ['display1', 'display2', 'h2', 'h3', 'body1', 'body2', 'caption'],
        shadows: ['small', 'medium']
      };

      const screens = [
        '../src/screens/profile/ProfileScreen.tsx',
        '../src/screens/profile/SettingsScreen.tsx',
        '../src/components/profile/ProfilePictureUpload.tsx'
      ];

      let allScreensCompliant = true;
      
      screens.forEach(screenPath => {
        const content = fs.readFileSync(path.join(__dirname, screenPath), 'utf8');
        
        // Check if screen uses proper color tokens
        if (!designTokensUsage.colors.some(color => content.includes(color))) {
          allScreensCompliant = false;
          this.results.themeTests.issues.push(`${screenPath} doesn't use proper color tokens`);
        }
        
        // Check typography usage
        if (!designTokensUsage.typography.some(typo => content.includes(typo))) {
          allScreensCompliant = false;
          this.results.themeTests.issues.push(`${screenPath} doesn't use typography tokens`);
        }
      });

      if (allScreensCompliant) {
        this.log('All screens comply with design system', 'success');
        this.results.themeTests.passed++;
      } else {
        this.log('Some screens don\'t fully comply with design system', 'error');
        this.results.themeTests.failed++;
      }

    } catch (error) {
      this.log(`Theme compliance test failed: ${error.message}`, 'error');
      this.results.themeTests.failed++;
    }
  }

  async testIntegrationFlow() {
    this.log('Testing integration flow between profile screens...', 'info');
    
    try {
      const profileScreen = fs.readFileSync(
        path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'), 'utf8'
      );
      const navigator = fs.readFileSync(
        path.join(__dirname, '../src/navigation/ProfileStackNavigator.tsx'), 'utf8'
      );

      // Test navigation flow consistency
      const navigationCalls = [
        "navigation.navigate('EditProfile'",
        "navigation.navigate('Settings'",
        "navigation.navigate('AccountManagement'"
      ];

      let allNavigationCallsExist = navigationCalls.every(call => 
        profileScreen.includes(call)
      );

      if (allNavigationCallsExist) {
        this.log('All navigation calls are properly implemented', 'success');
        this.results.integrationTests.passed++;
      } else {
        this.log('Missing navigation calls', 'error');
        this.results.integrationTests.failed++;
        this.results.integrationTests.issues.push('Missing navigation calls');
      }

      // Check if all navigation targets exist in navigator
      const screenNames = ['EditProfile', 'Settings', 'AccountManagement', 'Privacy', 'Support'];
      let allScreensExist = screenNames.every(screen => 
        navigator.includes(`name="${screen}"`)
      );

      if (allScreensExist) {
        this.log('All navigation targets exist in navigator', 'success');
        this.results.integrationTests.passed++;
      } else {
        this.log('Some navigation targets missing in navigator', 'error');
        this.results.integrationTests.failed++;
        this.results.integrationTests.issues.push('Navigation targets missing');
      }

      // Test prop passing consistency
      if (profileScreen.includes('{ user }') && navigator.includes('{ user?: User }')) {
        this.log('Props are passed consistently between screens', 'success');
        this.results.integrationTests.passed++;
      } else {
        this.log('Inconsistent prop passing', 'error');
        this.results.integrationTests.failed++;
        this.results.integrationTests.issues.push('Inconsistent prop passing');
      }

    } catch (error) {
      this.log(`Integration flow test failed: ${error.message}`, 'error');
      this.results.integrationTests.failed++;
    }
  }

  async testResponsiveDesignPatterns() {
    this.log('Testing responsive design patterns...', 'info');
    
    try {
      const profilePictureUpload = fs.readFileSync(
        path.join(__dirname, '../src/components/profile/ProfilePictureUpload.tsx'), 'utf8'
      );

      // Check for size variants
      if (profilePictureUpload.includes("size === 'small'") && 
          profilePictureUpload.includes("size === 'large'")) {
        this.log('ProfilePictureUpload has size variants', 'success');
        this.results.visualTests.passed++;
      } else {
        this.log('ProfilePictureUpload missing size variants', 'error');
        this.results.visualTests.failed++;
        this.results.visualTests.issues.push('Missing size variants in ProfilePictureUpload');
      }

      // Check for safe area usage
      const profileScreen = fs.readFileSync(
        path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'), 'utf8'
      );

      if (profileScreen.includes('useSafeAreaInsets') && 
          profileScreen.includes('paddingTop: insets.top')) {
        this.log('Safe area insets properly handled', 'success');
        this.results.visualTests.passed++;
      } else {
        this.log('Safe area insets not properly handled', 'error');
        this.results.visualTests.failed++;
        this.results.visualTests.issues.push('Safe area insets missing');
      }

    } catch (error) {
      this.log(`Responsive design test failed: ${error.message}`, 'error');
      this.results.visualTests.failed++;
    }
  }

  generateRecommendations() {
    // Analyze results and generate specific recommendations
    const totalIssues = this.results.visualTests.issues.length + 
                       this.results.integrationTests.issues.length + 
                       this.results.themeTests.issues.length;

    if (totalIssues > 0) {
      this.results.recommendations.push(
        'Fix identified issues to improve overall profile functionality quality'
      );
    }

    if (this.results.visualTests.failed > 0) {
      this.results.recommendations.push(
        'Standardize visual patterns across all profile components'
      );
    }

    if (this.results.themeTests.failed > 0) {
      this.results.recommendations.push(
        'Ensure consistent use of design tokens throughout profile screens'
      );
    }

    if (this.results.integrationTests.failed > 0) {
      this.results.recommendations.push(
        'Review navigation flow and prop passing between profile screens'
      );
    }
  }

  async runAllTests() {
    this.log('🎨 Starting visual and integration testing...', 'info');
    
    await this.testVisualConsistency();
    await this.testThemeCompliance();
    await this.testIntegrationFlow();
    await this.testResponsiveDesignPatterns();
    
    this.generateRecommendations();
    this.generateReport();
  }

  generateReport() {
    const allTests = [
      ...Object.values(this.results.visualTests),
      ...Object.values(this.results.integrationTests),
      ...Object.values(this.results.themeTests)
    ];
    
    const totalPassed = this.results.visualTests.passed + 
                       this.results.integrationTests.passed + 
                       this.results.themeTests.passed;
    const totalFailed = this.results.visualTests.failed + 
                       this.results.integrationTests.failed + 
                       this.results.themeTests.failed;
    const total = totalPassed + totalFailed;
    const passRate = total > 0 ? ((totalPassed / total) * 100).toFixed(1) : 0;

    console.log('\n' + '='.repeat(80));
    console.log('🎨 PROFILE VISUAL & INTEGRATION TEST REPORT');
    console.log('='.repeat(80));
    console.log(`📊 Visual Tests: ${this.results.visualTests.passed} passed, ${this.results.visualTests.failed} failed`);
    console.log(`🔗 Integration Tests: ${this.results.integrationTests.passed} passed, ${this.results.integrationTests.failed} failed`);
    console.log(`🎯 Theme Tests: ${this.results.themeTests.passed} passed, ${this.results.themeTests.failed} failed`);
    console.log(`📈 Overall Pass Rate: ${passRate}%`);
    console.log('='.repeat(80));

    // Show all issues
    const allIssues = [
      ...this.results.visualTests.issues,
      ...this.results.integrationTests.issues,
      ...this.results.themeTests.issues
    ];

    if (allIssues.length > 0) {
      console.log('🐛 ISSUES IDENTIFIED:');
      allIssues.forEach((issue, index) => {
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

    // Final assessment
    if (passRate >= 95) {
      console.log('🎉 EXCELLENT: Profile visual design is outstanding!');
    } else if (passRate >= 85) {
      console.log('👍 GOOD: Profile visual design is well implemented');
    } else if (passRate >= 75) {
      console.log('⚠️  NEEDS ATTENTION: Some visual consistency issues');
    } else {
      console.log('🚨 CRITICAL: Significant visual design issues need attention');
    }

    console.log('='.repeat(80));
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ProfileVisualTester();
  tester.runAllTests().catch(error => {
    console.error('💥 Visual test suite failed:', error);
    process.exit(1);
  });
}

module.exports = ProfileVisualTester;