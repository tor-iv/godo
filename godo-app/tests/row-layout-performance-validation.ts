import { performance } from 'perf_hooks';
import { rowLayoutUtils, rowLayoutDesignSystem } from '../src/design/rowLayoutTokens';
import { responsiveDesignSystem, getResponsiveFontSize, getResponsiveSpacing } from '../src/design/responsiveTokens';

/**
 * Performance Validation Suite for Row Layout Components
 * Tests rendering speed, memory usage, and calculation efficiency
 */

interface PerformanceMetrics {
  averageTime: number;
  minTime: number;
  maxTime: number;
  iterations: number;
  operationsPerSecond: number;
}

interface MemorySnapshot {
  used: number;
  total: number;
  external: number;
  heapUsed: number;
}

class RowLayoutPerformanceValidator {
  private iterations = 1000;
  private warmupIterations = 100;

  constructor(iterations = 1000) {
    this.iterations = iterations;
  }

  /**
   * Test layout calculation performance
   */
  async testLayoutCalculations(): Promise<PerformanceMetrics> {
    // Warmup
    for (let i = 0; i < this.warmupIterations; i++) {
      rowLayoutUtils.getOptimalLayout(3);
    }

    const times: number[] = [];
    
    for (let i = 0; i < this.iterations; i++) {
      const start = performance.now();
      rowLayoutUtils.getOptimalLayout(3);
      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateMetrics(times);
  }

  /**
   * Test number formatting performance
   */
  async testNumberFormatting(): Promise<PerformanceMetrics> {
    const testNumbers = [
      142, 1234, 12345, 123456, 1234567, 12345678, 123456789
    ];

    // Warmup
    for (let i = 0; i < this.warmupIterations; i++) {
      testNumbers.forEach(num => rowLayoutUtils.formatStatValue(num));
    }

    const times: number[] = [];
    
    for (let i = 0; i < this.iterations; i++) {
      const start = performance.now();
      testNumbers.forEach(num => rowLayoutUtils.formatStatValue(num));
      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateMetrics(times);
  }

  /**
   * Test color calculation performance
   */
  async testColorCalculations(): Promise<PerformanceMetrics> {
    const statTypes = ['eventsAttended', 'eventsSaved', 'friendsConnected'];
    const colorVariants: Array<'default' | 'monochrome' | 'colorful'> = ['default', 'monochrome', 'colorful'];

    // Warmup
    for (let i = 0; i < this.warmupIterations; i++) {
      statTypes.forEach(type => {
        colorVariants.forEach(variant => {
          rowLayoutUtils.getStatColors(type, variant);
        });
      });
    }

    const times: number[] = [];
    
    for (let i = 0; i < this.iterations; i++) {
      const start = performance.now();
      statTypes.forEach(type => {
        colorVariants.forEach(variant => {
          rowLayoutUtils.getStatColors(type, variant);
        });
      });
      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateMetrics(times);
  }

  /**
   * Test responsive calculation performance
   */
  async testResponsiveCalculations(): Promise<PerformanceMetrics> {
    const fontSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const;
    const spacingSizes = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24] as const;

    // Warmup
    for (let i = 0; i < this.warmupIterations; i++) {
      fontSizes.forEach(size => getResponsiveFontSize(size));
      spacingSizes.forEach(size => getResponsiveSpacing(size));
    }

    const times: number[] = [];
    
    for (let i = 0; i < this.iterations; i++) {
      const start = performance.now();
      fontSizes.forEach(size => getResponsiveFontSize(size));
      spacingSizes.forEach(size => getResponsiveSpacing(size));
      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateMetrics(times);
  }

  /**
   * Test memory usage during intensive operations
   */
  async testMemoryUsage(): Promise<{ initial: MemorySnapshot; peak: MemorySnapshot; final: MemorySnapshot }> {
    const getMemorySnapshot = (): MemorySnapshot => {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        return {
          used: usage.rss,
          total: usage.heapTotal,
          external: usage.external,
          heapUsed: usage.heapUsed,
        };
      }
      return { used: 0, total: 0, external: 0, heapUsed: 0 };
    };

    const initial = getMemorySnapshot();
    let peak = initial;

    // Perform memory-intensive operations
    for (let i = 0; i < this.iterations * 10; i++) {
      // Simulate component calculations
      rowLayoutUtils.getOptimalLayout(3);
      rowLayoutUtils.formatStatValue(Math.random() * 10000000);
      rowLayoutUtils.getStatColors('eventsAttended', 'default');
      
      if (i % 1000 === 0) {
        const current = getMemorySnapshot();
        if (current.heapUsed > peak.heapUsed) {
          peak = current;
        }
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const final = getMemorySnapshot();

    return { initial, peak, final };
  }

  /**
   * Test design system object access performance
   */
  async testDesignSystemAccess(): Promise<PerformanceMetrics> {
    const accessPaths = [
      () => rowLayoutDesignSystem.patterns.container.base,
      () => rowLayoutDesignSystem.patterns.row.singleRow,
      () => rowLayoutDesignSystem.typography.statValue.medium,
      () => rowLayoutDesignSystem.icons.iconContainer.base,
      () => rowLayoutDesignSystem.accessibility.touchTargets.base,
      () => responsiveDesignSystem.device.size,
      () => responsiveDesignSystem.typography.stats.medium,
      () => responsiveDesignSystem.layout.touchTarget.comfortable,
    ];

    // Warmup
    for (let i = 0; i < this.warmupIterations; i++) {
      accessPaths.forEach(fn => fn());
    }

    const times: number[] = [];
    
    for (let i = 0; i < this.iterations; i++) {
      const start = performance.now();
      accessPaths.forEach(fn => fn());
      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateMetrics(times);
  }

  /**
   * Run comprehensive performance test suite
   */
  async runFullSuite(): Promise<{
    layoutCalculations: PerformanceMetrics;
    numberFormatting: PerformanceMetrics;
    colorCalculations: PerformanceMetrics;
    responsiveCalculations: PerformanceMetrics;
    designSystemAccess: PerformanceMetrics;
    memoryUsage: { initial: MemorySnapshot; peak: MemorySnapshot; final: MemorySnapshot };
  }> {
    console.log('🚀 Starting Row Layout Performance Validation Suite...');
    
    const results = {
      layoutCalculations: await this.testLayoutCalculations(),
      numberFormatting: await this.testNumberFormatting(),
      colorCalculations: await this.testColorCalculations(),
      responsiveCalculations: await this.testResponsiveCalculations(),
      designSystemAccess: await this.testDesignSystemAccess(),
      memoryUsage: await this.testMemoryUsage(),
    };

    console.log('✅ Performance validation completed');
    return results;
  }

  /**
   * Generate performance report
   */
  generateReport(results: Awaited<ReturnType<typeof this.runFullSuite>>): string {
    const formatMetrics = (metrics: PerformanceMetrics) => `
      • Average: ${metrics.averageTime.toFixed(4)}ms
      • Min: ${metrics.minTime.toFixed(4)}ms  
      • Max: ${metrics.maxTime.toFixed(4)}ms
      • Ops/sec: ${metrics.operationsPerSecond.toFixed(0)}
    `;

    const formatMemory = (snapshot: MemorySnapshot) => `
      • Heap Used: ${(snapshot.heapUsed / 1024 / 1024).toFixed(2)}MB
      • Total: ${(snapshot.total / 1024 / 1024).toFixed(2)}MB
      • External: ${(snapshot.external / 1024 / 1024).toFixed(2)}MB
    `;

    return `
# Row Layout Performance Validation Report

## Layout Calculations Performance
${formatMetrics(results.layoutCalculations)}

## Number Formatting Performance  
${formatMetrics(results.numberFormatting)}

## Color Calculations Performance
${formatMetrics(results.colorCalculations)}

## Responsive Calculations Performance
${formatMetrics(results.responsiveCalculations)}

## Design System Access Performance
${formatMetrics(results.designSystemAccess)}

## Memory Usage Analysis
### Initial State
${formatMemory(results.memoryUsage.initial)}

### Peak Usage
${formatMemory(results.memoryUsage.peak)}

### Final State (after GC)
${formatMemory(results.memoryUsage.final)}

### Memory Efficiency
• Peak increase: ${((results.memoryUsage.peak.heapUsed - results.memoryUsage.initial.heapUsed) / 1024 / 1024).toFixed(2)}MB
• Final overhead: ${((results.memoryUsage.final.heapUsed - results.memoryUsage.initial.heapUsed) / 1024 / 1024).toFixed(2)}MB

## Performance Benchmarks Status

### ✅ Excellent (< 0.01ms average)
- Layout calculations: ${results.layoutCalculations.averageTime < 0.01 ? '✅' : '❌'}
- Design system access: ${results.designSystemAccess.averageTime < 0.01 ? '✅' : '❌'}

### ✅ Good (< 0.1ms average)
- Number formatting: ${results.numberFormatting.averageTime < 0.1 ? '✅' : '❌'}
- Color calculations: ${results.colorCalculations.averageTime < 0.1 ? '✅' : '❌'}

### ✅ Acceptable (< 1ms average)
- Responsive calculations: ${results.responsiveCalculations.averageTime < 1 ? '✅' : '❌'}

### Memory Efficiency
- No memory leaks: ${results.memoryUsage.final.heapUsed <= results.memoryUsage.initial.heapUsed * 1.1 ? '✅' : '❌'}
- Peak memory < 50MB: ${(results.memoryUsage.peak.heapUsed - results.memoryUsage.initial.heapUsed) / 1024 / 1024 < 50 ? '✅' : '❌'}

## Recommendations

${this.generateRecommendations(results)}

---
Generated on: ${new Date().toISOString()}
Test iterations: ${this.iterations}
    `;
  }

  private calculateMetrics(times: number[]): PerformanceMetrics {
    const averageTime = times.reduce((a, b) => a + b) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const operationsPerSecond = 1000 / averageTime;

    return {
      averageTime,
      minTime,
      maxTime,
      iterations: this.iterations,
      operationsPerSecond,
    };
  }

  private generateRecommendations(results: Awaited<ReturnType<typeof this.runFullSuite>>): string {
    const recommendations: string[] = [];

    if (results.layoutCalculations.averageTime > 0.01) {
      recommendations.push('• Consider memoizing layout calculations for better performance');
    }

    if (results.numberFormatting.averageTime > 0.1) {
      recommendations.push('• Implement number formatting cache for frequently used values');
    }

    if (results.colorCalculations.averageTime > 0.1) {
      recommendations.push('• Pre-calculate color combinations and store in constants');
    }

    const memoryIncrease = (results.memoryUsage.peak.heapUsed - results.memoryUsage.initial.heapUsed) / 1024 / 1024;
    if (memoryIncrease > 50) {
      recommendations.push('• High memory usage detected - review object creation in loops');
    }

    if (recommendations.length === 0) {
      recommendations.push('• All performance metrics are within acceptable ranges ✅');
    }

    return recommendations.join('\n');
  }
}

// Export validation utilities
export const runPerformanceValidation = async (iterations = 1000) => {
  const validator = new RowLayoutPerformanceValidator(iterations);
  const results = await validator.runFullSuite();
  const report = validator.generateReport(results);
  
  return {
    results,
    report,
    validator,
  };
};

export { RowLayoutPerformanceValidator };
export default runPerformanceValidation;