import { sql } from 'drizzle-orm';
import { db } from './client';

export async function createNextMonthPartitions() {
  const now = new Date();
  
  // Create partitions for current month, next month, and the month after
  const dates = [
    new Date(now.getFullYear(), now.getMonth(), 1),
    new Date(now.getFullYear(), now.getMonth() + 1, 1),
    new Date(now.getFullYear(), now.getMonth() + 2, 1),
  ];

  const tables = ['typing_tests', 'analytics_events', 'keystroke_summaries'];

  for (const date of dates) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Ranges
    const startRange = `${year}-${month}-01 00:00:00`;
    
    // End range date (1st of next month)
    const nextDate = new Date(year, date.getMonth() + 1, 1);
    const endYear = nextDate.getFullYear();
    const endMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
    const endRange = `${endYear}-${endMonth}-01 00:00:00`;

    for (const table of tables) {
      const partitionName = `${table}_${year}_${month}`;
      try {
        await db.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS ${partitionName} 
          PARTITION OF ${table} 
          FOR VALUES FROM ('${startRange}') TO ('${endRange}')
        `));
        console.log(`Verified or created partition ${partitionName}`);
      } catch (err) {
        console.error(`Failed to create partition ${partitionName}:`, err);
      }
    }
  }
}

export async function archiveOldPartitions() {
  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const year = cutoffDate.getFullYear();
  const month = String(cutoffDate.getMonth() + 1).padStart(2, '0');
  
  const tables = ['typing_tests', 'analytics_events', 'keystroke_summaries'];
  for (const table of tables) {
    const partitionName = `${table}_${year}_${month}`;
    try {
      await db.execute(sql.raw(`
        ALTER TABLE IF EXISTS ${table} DETACH PARTITION ${partitionName}
      `));
      console.log(`Detached and archived partition ${partitionName}`);
    } catch (err) {
      // Normal if partition does not exist
    }
  }
}
