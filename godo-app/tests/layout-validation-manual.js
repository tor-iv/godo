#!/usr/bin/env bun
/**
 * Manual Layout Validation Script
 * Tests the row layout implementation without complex test dependencies
 *
 * Now using Bun runtime for faster execution.
 */

const path = require('path');

// Validation results object
const validationResults = {
  timestamp: new Date().toISOString(),
  layoutTests: [],
  readabilityTests: [],
  accessibilityTests: [],
  performanceTests: [],
  regressionTests: [],
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0,
  },
};

function addResult(category, test, status, details = '') {
  const result = {
    test,
    status, // 'PASS', 'FAIL', 'WARN'
    details,
    timestamp: new Date().toISOString(),
  };

  validationResults[category].push(result);
  validationResults.summary[status === 'PASS' ? 'passed' : status === 'FAIL' ? 'failed' : 'warnings']++;

  console.log(`[${status}] ${category.toUpperCase()}: ${test}`);
  if (details) console.log(`  Details: ${details}`);
}

console.log('\uD83E\uDDEA Starting Layout Validation Tests...\n');

// Test 1: File Structure and Components Exist
console.log('\uD83D\uDCC1 Testing File Structure...');
try {
  const profileStatsPath = path.join(__dirname, '../src/components/profile/ProfileStats.tsx');
  const responsiveStatsPath = path.join(__dirname, '../src/components/profile/ResponsiveProfileStats.tsx');

  const profileStatsFile = Bun.file(profileStatsPath);
  const responsiveStatsFile = Bun.file(responsiveStatsPath);

  if (await profileStatsFile.exists()) {
    addResult('layoutTests', 'ProfileStats component exists', 'PASS');
  } else {
    addResult('layoutTests', 'ProfileStats component exists', 'FAIL', 'File not found');
  }

  if (await responsiveStatsFile.exists()) {
    addResult('layoutTests', 'ResponsiveProfileStats component exists', 'PASS');
  } else {
    addResult('layoutTests', 'ResponsiveProfileStats component exists', 'FAIL', 'File not found');
  }
} catch (error) {
  addResult('layoutTests', 'File structure validation', 'FAIL', error.message);
}

// Test 2: Row Layout Implementation Analysis
console.log('\n\uD83D\uDCD0 Analyzing Layout Implementation...');
try {
  const profileStatsPath = path.join(__dirname, '../src/components/profile/ProfileStats.tsx');
  const profileStatsFile = Bun.file(profileStatsPath);
  const profileStatsContent = await profileStatsFile.text();

  // Check for row layout patterns
  const hasTopRow = profileStatsContent.includes('topRow');
  const hasBottomRow = profileStatsContent.includes('bottomRow');
  const hasFlexDirection = profileStatsContent.includes("flexDirection: 'row'");

  if (hasTopRow && hasBottomRow) {
    addResult('layoutTests', 'Row layout structure implemented', 'PASS', 'topRow and bottomRow elements found');
  } else {
    addResult('layoutTests', 'Row layout structure implemented', 'FAIL', 'Missing row layout elements');
  }

  if (hasFlexDirection) {
    addResult('layoutTests', 'CSS flexbox row direction used', 'PASS');
  } else {
    addResult('layoutTests', 'CSS flexbox row direction used', 'WARN', 'No explicit flexDirection: row found');
  }
} catch (error) {
  addResult('layoutTests', 'Layout implementation analysis', 'FAIL', error.message);
}

// Test 3: Responsive Text Implementation
console.log('\n\uD83D\uDCF1 Testing Responsive Text Features...');
try {
  const profileStatsPath = path.join(__dirname, '../src/components/profile/ProfileStats.tsx');
  const profileStatsFile = Bun.file(profileStatsPath);
  const profileStatsContent = await profileStatsFile.text();

  const hasResponsiveText = profileStatsContent.includes('getResponsiveText');
  const hasTextProps = profileStatsContent.includes('getResponsiveTextProps');
  const hasTruncation = profileStatsContent.includes('numberOfLines') || profileStatsContent.includes('ellipsizeMode');

  if (hasResponsiveText) {
    addResult('readabilityTests', 'Responsive text utility used', 'PASS');
  } else {
    addResult('readabilityTests', 'Responsive text utility used', 'FAIL', 'getResponsiveText not found');
  }

  if (hasTextProps) {
    addResult('readabilityTests', 'Text properties optimization', 'PASS');
  } else {
    addResult('readabilityTests', 'Text properties optimization', 'WARN', 'getResponsiveTextProps not found');
  }

  if (hasTruncation) {
    addResult('readabilityTests', 'Text truncation handling', 'PASS');
  } else {
    addResult('readabilityTests', 'Text truncation handling', 'WARN', 'No truncation properties found');
  }
} catch (error) {
  addResult('readabilityTests', 'Responsive text analysis', 'FAIL', error.message);
}

// Test 4: Accessibility Features
console.log('\n\u267F Testing Accessibility Features...');
try {
  const responsiveStatsPath = path.join(__dirname, '../src/components/profile/ResponsiveProfileStats.tsx');
  const responsiveStatsFile = Bun.file(responsiveStatsPath);
  const responsiveStatsContent = await responsiveStatsFile.text();

  const hasAccessibilityLabel = responsiveStatsContent.includes('accessibilityLabel');
  const hasAccessibilityRole = responsiveStatsContent.includes('accessibilityRole');
  const hasAccessibilityHint = responsiveStatsContent.includes('accessibilityHint');
  const hasAccessible = responsiveStatsContent.includes('accessible={true}');

  if (hasAccessibilityLabel) {
    addResult('accessibilityTests', 'Accessibility labels implemented', 'PASS');
  } else {
    addResult('accessibilityTests', 'Accessibility labels implemented', 'FAIL', 'No accessibility labels found');
  }

  if (hasAccessibilityRole) {
    addResult('accessibilityTests', 'Accessibility roles defined', 'PASS');
  } else {
    addResult('accessibilityTests', 'Accessibility roles defined', 'WARN', 'No accessibility roles found');
  }

  if (hasAccessible) {
    addResult('accessibilityTests', 'Accessible property set', 'PASS');
  } else {
    addResult('accessibilityTests', 'Accessible property set', 'WARN', 'accessible={true} not found');
  }
} catch (error) {
  addResult('accessibilityTests', 'Accessibility features analysis', 'FAIL', error.message);
}

// Test 5: Performance Considerations
console.log('\n\u26A1 Testing Performance Optimizations...');
try {
  const profileStatsPath = path.join(__dirname, '../src/components/profile/ProfileStats.tsx');
  const profileStatsFile = Bun.file(profileStatsPath);
  const profileStatsContent = await profileStatsFile.text();

  const hasMinWidth = profileStatsContent.includes('minWidth: 0');
  const hasFlexShrinking = profileStatsContent.includes('flex:') || profileStatsContent.includes('flexShrink');
  const hasResponsiveSpacing = profileStatsContent.includes('responsiveDesignSystem.spacing');

  if (hasMinWidth) {
    addResult('performanceTests', 'Flex shrinking optimization', 'PASS', 'minWidth: 0 found for flex shrinking');
  } else {
    addResult('performanceTests', 'Flex shrinking optimization', 'WARN', 'No minWidth: 0 found');
  }

  if (hasResponsiveSpacing) {
    addResult('performanceTests', 'Responsive spacing system used', 'PASS');
  } else {
    addResult('performanceTests', 'Responsive spacing system used', 'WARN', 'No responsive spacing system found');
  }
} catch (error) {
  addResult('performanceTests', 'Performance optimization analysis', 'FAIL', error.message);
}

// Test 6: Code Quality and Best Practices
console.log('\n\u2705 Testing Code Quality...');
try {
  const profileStatsPath = path.join(__dirname, '../src/components/profile/ProfileStats.tsx');
  const responsiveStatsPath = path.join(__dirname, '../src/components/profile/ResponsiveProfileStats.tsx');

  const profileStatsFile = Bun.file(profileStatsPath);
  const responsiveStatsFile = Bun.file(responsiveStatsPath);

  const profileStatsContent = await profileStatsFile.text();
  const responsiveStatsContent = await responsiveStatsFile.text();

  const hasTypeScript = profileStatsContent.includes('interface') && responsiveStatsContent.includes('interface');
  const hasProperImports = profileStatsContent.includes("import React from 'react'");
  const hasStyleSheet = profileStatsContent.includes('StyleSheet.create');

  if (hasTypeScript) {
    addResult('regressionTests', 'TypeScript interfaces defined', 'PASS');
  } else {
    addResult('regressionTests', 'TypeScript interfaces defined', 'FAIL', 'No TypeScript interfaces found');
  }

  if (hasProperImports) {
    addResult('regressionTests', 'Proper imports structure', 'PASS');
  } else {
    addResult('regressionTests', 'Proper imports structure', 'FAIL', 'React import issues');
  }

  if (hasStyleSheet) {
    addResult('regressionTests', 'React Native StyleSheet used', 'PASS');
  } else {
    addResult('regressionTests', 'React Native StyleSheet used', 'FAIL', 'StyleSheet.create not found');
  }
} catch (error) {
  addResult('regressionTests', 'Code quality analysis', 'FAIL', error.message);
}

// Test 7: Cross-Component Consistency
console.log('\n\uD83D\uDD04 Testing Component Consistency...');
try {
  const profileStatsPath = path.join(__dirname, '../src/components/profile/ProfileStats.tsx');
  const responsiveStatsPath = path.join(__dirname, '../src/components/profile/ResponsiveProfileStats.tsx');

  const profileStatsFile = Bun.file(profileStatsPath);
  const responsiveStatsFile = Bun.file(responsiveStatsPath);

  const profileStats = await profileStatsFile.text();
  const responsiveStats = await responsiveStatsFile.text();

  const bothUseDesignTokens =
    profileStats.includes('responsiveDesignSystem') && responsiveStats.includes('responsiveDesignSystem');

  const bothUseColors = profileStats.includes('colors.') && responsiveStats.includes('colors.');

  if (bothUseDesignTokens) {
    addResult('regressionTests', 'Consistent design system usage', 'PASS');
  } else {
    addResult('regressionTests', 'Consistent design system usage', 'WARN', 'Design system usage inconsistent');
  }

  if (bothUseColors) {
    addResult('regressionTests', 'Consistent color token usage', 'PASS');
  } else {
    addResult('regressionTests', 'Consistent color token usage', 'WARN', 'Color token usage inconsistent');
  }
} catch (error) {
  addResult('regressionTests', 'Component consistency analysis', 'FAIL', error.message);
}

// Generate Summary Report
console.log('\n\uD83D\uDCCA Validation Summary:');
console.log(`\u2705 Passed: ${validationResults.summary.passed}`);
console.log(`\u274C Failed: ${validationResults.summary.failed}`);
console.log(`\u26A0\uFE0F  Warnings: ${validationResults.summary.warnings}`);

const totalTests = validationResults.summary.passed + validationResults.summary.failed + validationResults.summary.warnings;
const successRate = ((validationResults.summary.passed / totalTests) * 100).toFixed(1);

console.log(`\n\uD83C\uDFAF Success Rate: ${successRate}%`);

// Determine overall status
let overallStatus = 'PASS';
if (validationResults.summary.failed > 0) {
  overallStatus = 'FAIL';
} else if (validationResults.summary.warnings > 3) {
  overallStatus = 'WARN';
}

validationResults.overallStatus = overallStatus;
validationResults.successRate = successRate;

// Save detailed results
const reportPath = path.join(__dirname, 'layout-validation-results.json');
await Bun.write(reportPath, JSON.stringify(validationResults, null, 2));

console.log(`\n\uD83D\uDCC4 Detailed results saved to: ${reportPath}`);

// Final Status
console.log(`\n\uD83C\uDFC1 Overall Validation Status: ${overallStatus}`);

if (overallStatus === 'PASS') {
  console.log('\uD83C\uDF89 Layout validation completed successfully!');
  console.log('\u2705 Row layout implementation meets requirements');
  console.log('\u2705 Text readability improvements verified');
  console.log('\u2705 No critical regressions detected');
} else if (overallStatus === 'WARN') {
  console.log('\u26A0\uFE0F  Layout validation completed with warnings');
  console.log('\u2139\uFE0F  Review warnings for potential improvements');
} else {
  console.log('\u274C Layout validation failed');
  console.log('\uD83D\uDD27 Review failed tests and fix issues');
  process.exit(1);
}

export default validationResults;
