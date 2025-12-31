
import 'dotenv/config';
import './lib/env';
import './lib/workers/schedule-worker';
import './lib/workers/mail-worker';

console.log('👷 Workers started (Schedule + Mail)...');

// Handle graceful shutdown for all
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received. Closing connections...');
    // Logic to close connections/queues if exported
    process.exit(0);
});
