import { logger } from './logger';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function sendSlackAlert(message: string, fields?: Record<string, string>) {
  logger.warn(`[ALERT TRIGGERED] ${message}`, fields);
  
  if (SLACK_WEBHOOK_URL) {
    try {
      const response = await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *SSC Typing Platform Alert* 🚨\n${message}`,
          attachments: fields ? [
            {
              fields: Object.entries(fields).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true,
              })),
            }
          ] : [],
        }),
      });
      if (!response.ok) {
        logger.error(`Failed to send alert to Slack: ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Error sending Slack alert:', error);
    }
  }
}

export const SLA_LIMITS = {
  API: 150, // ms
  DB: 50,  // ms
  Redis: 10, // ms
};

export async function checkDurationSLA(type: 'API' | 'DB' | 'Redis', durationMs: number, context: Record<string, any>) {
  const limit = SLA_LIMITS[type];
  if (durationMs > limit) {
    await sendSlackAlert(
      `SLA Breach: ${type} request took ${durationMs.toFixed(2)}ms (Limit: ${limit}ms)`,
      {
        Type: type,
        Duration: `${durationMs.toFixed(2)}ms`,
        Limit: `${limit}ms`,
        ...Object.fromEntries(Object.entries(context).map(([k, v]) => [k, String(v)])),
      }
    );
  }
}
