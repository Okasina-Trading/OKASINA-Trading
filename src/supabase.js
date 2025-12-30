import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils/env.js';

const { url, key } = getEnv();
export const supabase = createClient(url, key);
