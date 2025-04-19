type MetricType = 'counter' | 'gauge' | 'histogram';

interface Metric {
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

class Metrics {
  private metrics: Map<string, Metric[]>;

  constructor() {
    this.metrics = new Map();
  }

  private record(name: string, type: MetricType, value: number, labels?: Record<string, string>) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metric: Metric = {
      type,
      value,
      labels,
      timestamp: Date.now(),
    };

    this.metrics.get(name)!.push(metric);
  }

  increment(name: string, labels?: Record<string, string>) {
    this.record(name, 'counter', 1, labels);
  }

  gauge(name: string, value: number, labels?: Record<string, string>) {
    this.record(name, 'gauge', value, labels);
  }

  histogram(name: string, value: number, labels?: Record<string, string>) {
    this.record(name, 'histogram', value, labels);
  }

  getMetrics(): Record<string, Metric[]> {
    return Object.fromEntries(this.metrics);
  }

  // Get the latest value for a specific metric
  getMetric(name: string): Metric | undefined {
    const metrics = this.metrics.get(name);
    return metrics?.[metrics.length - 1];
  }
}

export const metrics = new Metrics();
