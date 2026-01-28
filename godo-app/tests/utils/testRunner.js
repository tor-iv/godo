#!/usr/bin/env bun
/**
 * @fileoverview Test Runner and Coverage Reporter
 * @author Testing Team
 * @description Utility for running tests with proper coverage reporting and validation
 *
 * Now using Bun runtime for faster execution.
 */

const path = require('path');

// Test configuration
const TEST_CONFIG = {
  // Coverage thresholds
  coverage: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Per-file thresholds for critical components
    perFile: {
      'src/services/UserService.ts': {
        branches: 85,
        functions: 90,
        lines: 90,
        statements: 90,
      },
      'src/components/profile/UserProfile.tsx': {
        branches: 80,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
  },

  // Test suites
  suites: {
    unit: {
      pattern: 'tests/unit/**/*.test.{js,jsx,ts,tsx}',
      coverage: true,
    },
    integration: {
      pattern: 'tests/integration/**/*.test.{js,jsx,ts,tsx}',
      coverage: true,
    },
    accessibility: {
      pattern: 'tests/unit/accessibility/**/*.test.{js,jsx,ts,tsx}',
      coverage: false, // Accessibility tests don't need coverage
    },
    validation: {
      pattern: 'tests/unit/validation/**/*.test.{js,jsx,ts,tsx}',
      coverage: true,
    },
    e2e: {
      pattern: 'tests/e2e/**/*.test.{js,jsx,ts,tsx}',
      coverage: false, // E2E tests run against compiled code
    },
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`\u274C ${message}`, 'red');
}

function success(message) {
  log(`\u2705 ${message}`, 'green');
}

function warning(message) {
  log(`\u26A0\uFE0F  ${message}`, 'yellow');
}

function info(message) {
  log(`\u2139\uFE0F  ${message}`, 'blue');
}

// Test runner functions using Bun.spawnSync
function runJest(options = {}) {
  const {
    pattern = '',
    coverage = false,
    watch = false,
    verbose = false,
    updateSnapshots = false,
    bail = false,
    maxWorkers = undefined,
  } = options;

  const args = [];

  if (pattern) args.push(pattern);
  if (coverage) args.push('--coverage');
  if (watch) args.push('--watch');
  if (verbose) args.push('--verbose');
  if (updateSnapshots) args.push('--updateSnapshot');
  if (bail) args.push('--bail');
  if (maxWorkers) args.push(`--maxWorkers=${maxWorkers}`);

  // Always use colors and show progress
  args.push('--colors', '--progress');

  try {
    const result = Bun.spawnSync(['bunx', 'jest', ...args], {
      stdio: ['inherit', 'inherit', 'inherit'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        CI: process.env.CI || 'false',
      },
      cwd: process.cwd(),
    });
    return result.exitCode === 0;
  } catch (err) {
    return false;
  }
}

function runTestSuite(suiteName) {
  const suite = TEST_CONFIG.suites[suiteName];
  if (!suite) {
    error(`Unknown test suite: ${suiteName}`);
    return false;
  }

  info(`Running ${suiteName} tests...`);
  log('\u2500'.repeat(60), 'blue');

  const passed = runJest({
    pattern: suite.pattern,
    coverage: suite.coverage,
    verbose: true,
  });

  if (passed) {
    success(`${suiteName} tests passed!`);
  } else {
    error(`${suiteName} tests failed!`);
  }

  return passed;
}

function runAllTests() {
  info('Running all test suites...');
  log('='.repeat(60), 'cyan');

  const results = {};
  let allPassed = true;

  // Run each test suite
  for (const [suiteName, suite] of Object.entries(TEST_CONFIG.suites)) {
    const passed = runTestSuite(suiteName);
    results[suiteName] = passed;
    if (!passed) allPassed = false;
  }

  // Print summary
  log('='.repeat(60), 'cyan');
  info('Test Summary:');

  for (const [suiteName, passed] of Object.entries(results)) {
    const status = passed ? '\u2705 PASS' : '\u274C FAIL';
    const color = passed ? 'green' : 'red';
    log(`  ${suiteName}: ${status}`, color);
  }

  if (allPassed) {
    success('All tests passed! \uD83C\uDF89');
  } else {
    error('Some tests failed! \uD83D\uDEA8');
  }

  return allPassed;
}

async function generateCoverageReport() {
  info('Generating detailed coverage report...');

  try {
    // Run tests with coverage
    const result = Bun.spawnSync(
      ['bunx', 'jest', '--coverage', '--coverageReporters=text', '--coverageReporters=html', '--coverageReporters=lcov'],
      { stdio: ['inherit', 'inherit', 'inherit'], cwd: process.cwd() }
    );

    if (result.exitCode !== 0) {
      error('Failed to generate coverage report');
      return false;
    }

    // Check if coverage directory exists
    const coverageDir = path.join(process.cwd(), 'coverage');
    const coverageDirFile = Bun.file(coverageDir);

    const htmlReportPath = path.join(coverageDir, 'lcov-report', 'index.html');
    const htmlReportFile = Bun.file(htmlReportPath);

    if (await htmlReportFile.exists()) {
      success(`Coverage report generated at: ${htmlReportPath}`);
    }

    return true;
  } catch (err) {
    error('Failed to generate coverage report');
    return false;
  }
}

async function validateCoverage() {
  const coverageFile = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  const file = Bun.file(coverageFile);

  if (!(await file.exists())) {
    warning('Coverage report not found. Run tests with coverage first.');
    return false;
  }

  try {
    const coverageText = await file.text();
    const coverage = JSON.parse(coverageText);
    const { total } = coverage;
    const thresholds = TEST_CONFIG.coverage.global;

    info('Coverage Validation:');
    log('\u2500'.repeat(40), 'blue');

    let allPassed = true;
    const metrics = ['branches', 'functions', 'lines', 'statements'];

    for (const metric of metrics) {
      const actual = total[metric].pct;
      const required = thresholds[metric];
      const passed = actual >= required;

      if (!passed) allPassed = false;

      const status = passed ? '\u2705' : '\u274C';
      const color = passed ? 'green' : 'red';
      log(`  ${metric}: ${actual}% (required: ${required}%) ${status}`, color);
    }

    if (allPassed) {
      success('Coverage requirements met! \uD83D\uDCCA');
    } else {
      error('Coverage requirements not met! \uD83D\uDCC9');
    }

    return allPassed;
  } catch (err) {
    error('Failed to validate coverage');
    return false;
  }
}

function watchTests(pattern) {
  info('Starting test watcher...');
  log('Press "a" to run all tests, "q" to quit', 'yellow');

  runJest({
    pattern,
    watch: true,
    coverage: false,
  });
}

function debugTests(pattern) {
  info('Starting tests in debug mode...');

  return runJest({
    pattern,
    verbose: true,
    bail: true,
    maxWorkers: 1,
  });
}

function updateSnapshots() {
  info('Updating Jest snapshots...');

  const passed = runJest({
    updateSnapshots: true,
  });

  if (passed) {
    success('Snapshots updated successfully!');
  } else {
    error('Failed to update snapshots!');
  }

  return passed;
}

// CLI interface
function showHelp() {
  log('Test Runner Usage:', 'cyan');
  log('\u2500'.repeat(50), 'blue');
  log('bun run test                    Run all tests');
  log('bun run test unit              Run unit tests');
  log('bun run test integration       Run integration tests');
  log('bun run test accessibility     Run accessibility tests');
  log('bun run test validation        Run validation tests');
  log('bun run test e2e              Run end-to-end tests');
  log('bun run test coverage         Generate coverage report');
  log('bun run test validate         Validate coverage requirements');
  log('bun run test watch [pattern]  Watch for changes and re-run tests');
  log('bun run test debug [pattern]  Run tests in debug mode');
  log('bun run test update           Update Jest snapshots');
  log('bun run test help             Show this help');
  log('');
  log('Examples:', 'yellow');
  log('bun run test unit -- --watch');
  log('bun run test "UserProfile.test"');
  log('bun run test coverage && bun run test validate');
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  const pattern = args[1];

  switch (command) {
    case 'all':
      return runAllTests() ? 0 : 1;

    case 'unit':
    case 'integration':
    case 'accessibility':
    case 'validation':
    case 'e2e':
      return runTestSuite(command) ? 0 : 1;

    case 'coverage':
      return (await generateCoverageReport()) ? 0 : 1;

    case 'validate':
      return (await validateCoverage()) ? 0 : 1;

    case 'watch':
      watchTests(pattern);
      return 0;

    case 'debug':
      return debugTests(pattern) ? 0 : 1;

    case 'update':
      return updateSnapshots() ? 0 : 1;

    case 'help':
      showHelp();
      return 0;

    default:
      // Treat unknown commands as test patterns
      const passed = runJest({
        pattern: command,
        verbose: true,
      });
      return passed ? 0 : 1;
  }
}

// Run if called directly
const exitCode = await main();
process.exit(exitCode);
