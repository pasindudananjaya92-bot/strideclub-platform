import { runSentinelHealth } from './sentinelHealth.ts';
import { runFullAutonomousCycle } from './autonomousEngine.ts';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function startSentinelScheduler() {
  setTimeout(() => {
    runSentinelHealth(true).catch((err) => {
      console.error('Sentinel boot health failed:', err);
    });
  }, 20_000);

  setInterval(() => {
    runSentinelHealth(true).catch((err) => {
      console.error('Sentinel 6h health failed:', err);
    });
  }, SIX_HOURS_MS);

  setInterval(() => {
    runFullAutonomousCycle().catch((err) => {
      console.error('Sentinel daily cycle failed:', err);
    });
  }, ONE_DAY_MS);

  console.log(
    'StrideClub Sentinel in-process scheduler started (health every 6h, full cycle every 24h, while container is awake)'
  );
}
 
