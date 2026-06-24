import { logger } from './logger';

export const metrics = {
  counter: (name: string, value = 1, tags?: Record<string, string>) => {
    logger.info(`[METRIC COUNTER] ${name}: ${value}`, { metricName: name, metricValue: value, tags });
  },
  gauge: (name: string, value: number, tags?: Record<string, string>) => {
    logger.info(`[METRIC GAUGE] ${name}: ${value}`, { metricName: name, metricValue: value, tags });
  },
  histogram: (name: string, value: number, tags?: Record<string, string>) => {
    logger.info(`[METRIC HISTOGRAM] ${name}: ${value}`, { metricName: name, metricValue: value, tags });
  }
};

export default metrics;
