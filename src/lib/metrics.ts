interface MetricSample {
  timestamp: number
  value: number
  labels?: Record<string, string>
}

interface ParsedMetric {
  name: string
  type: 'counter' | 'gauge' | 'histogram' | 'summary'
  help?: string
  samples: MetricSample[]
}

export function parsePrometheusText(text: string): ParsedMetric[] {
  const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'))
  const metrics: ParsedMetric[] = []
  const metricMap = new Map<string, ParsedMetric>()

  for (const line of lines) {
    if (line.startsWith('# HELP')) {
      const [, name, help] = line.split(' ')
      if (!metricMap.has(name)) {
        metricMap.set(name, { name, type: 'gauge', samples: [] })
      }
      metricMap.get(name)!.help = help
    } else if (line.startsWith('# TYPE')) {
      const [, name, type] = line.split(' ')
      if (!metricMap.has(name)) {
        metricMap.set(name, { name, type: type as any, samples: [] })
      } else {
        metricMap.get(name)!.type = type as any
      }
    } else {
      // Parse metric line: name{labels} value timestamp?
      const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\s*(\{[^}]*\})?\s+([+-]?[0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?)\s*([0-9]+)?/)
      if (match) {
        const [, name, labelsStr, valueStr, timestampStr] = match
        const value = parseFloat(valueStr)
        const timestamp = timestampStr ? parseInt(timestampStr) * 1000 : Date.now()
        
        let labels: Record<string, string> = {}
        if (labelsStr) {
          const labelMatches = labelsStr.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"([^"]*)"/g)
          if (labelMatches) {
            for (const labelMatch of labelMatches) {
              const [, key, val] = labelMatch.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"([^"]*)"/)!
              labels[key] = val
            }
          }
        }

        if (!metricMap.has(name)) {
          metricMap.set(name, { name, type: 'gauge', samples: [] })
        }
        metricMap.get(name)!.samples.push({ timestamp, value, labels })
      }
    }
  }

  return Array.from(metricMap.values())
}

export function getMetricSeries(metrics: ParsedMetric[], metricName: string, labelFilters?: Record<string, string>) {
  const metric = metrics.find(m => m.name === metricName)
  if (!metric) return []

  let samples = metric.samples
  if (labelFilters) {
    samples = samples.filter(sample => {
      return Object.entries(labelFilters).every(([key, value]) => 
        sample.labels?.[key] === value
      )
    })
  }

  return samples.map(sample => ({
    timestamp: sample.timestamp,
    value: sample.value,
    labels: sample.labels || {}
  }))
}

export function aggregateHistogramBuckets(metrics: ParsedMetric[], metricName: string) {
  const buckets = getMetricSeries(metrics, `${metricName}_bucket`)
  const count = getMetricSeries(metrics, `${metricName}_count`)[0]?.value || 0
  const sum = getMetricSeries(metrics, `${metricName}_sum`)[0]?.value || 0

  // Group by le (less than or equal) label
  const bucketMap = new Map<string, number>()
  for (const bucket of buckets) {
    const le = bucket.labels.le
    if (le) {
      bucketMap.set(le, bucket.value)
    }
  }

  // Convert to cumulative distribution
  const sortedBuckets = Array.from(bucketMap.entries())
    .map(([le, count]) => ({ le: parseFloat(le), count }))
    .sort((a, b) => a.le - b.le)

  return {
    buckets: sortedBuckets,
    count,
    sum,
    average: count > 0 ? sum / count : 0
  }
}
