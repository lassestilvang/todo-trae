import { GlobalRegistrator } from '@happy-dom/global-registrator';
import dotenv from 'dotenv';

// Load .env.local for test environment (does not override existing env vars)
dotenv.config({ path: '.env.local' });

GlobalRegistrator.register();
