import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

async function verifyPhase2() {
    console.log('🔍 Phase 2 Verification\n');

    try {
        // Check TITAN tables
        console.log('1️⃣ Checking TITAN tables...');
        const { data: agentRuns, error: ar_error } = await supabase
            .from('az_agent_runs')
            .select('*')
            .limit(5)
            .order('started_at', { ascending: false });

        if (ar_error) {
            console.log('   ❌ az_agent_runs:', ar_error.message);
        } else {
            console.log(`   ✅ az_agent_runs: ${agentRuns.length} recent runs`);
            if (agentRuns.length > 0) {
                console.log(`      Latest: ${agentRuns[0].agent_name} (${agentRuns[0].status})`);
            }
        }

        const { data: attempts, error: att_error } = await supabase
            .from('az_auto_fix_attempts')
            .select('*')
            .limit(5);

        if (att_error) {
            console.log('   ❌ az_auto_fix_attempts:', att_error.message);
        } else {
            console.log(`   ✅ az_auto_fix_attempts: ${attempts.length} attempts logged`);
        }

        // Check retry limit function
        console.log('\n2️⃣ Testing retry limit function...');
        const { data: canRetry, error: func_error } = await supabase.rpc('check_auto_fix_retry_limit', {
            p_error_type: 'test_error',
            p_max_retries: 3
        });

        if (func_error) {
            console.log('   ❌ Function error:', func_error.message);
        } else {
            console.log(`   ✅ Function works: canRetry = ${canRetry}`);
        }

        // Check agent activity view
        console.log('\n3️⃣ Checking agent activity view...');
        const { data: activity, error: view_error } = await supabase
            .from('az_agent_activity')
            .select('*');

        if (view_error) {
            console.log('   ❌ View error:', view_error.message);
        } else {
            console.log(`   ✅ View works: ${activity.length} agents active`);
            activity.forEach(a => {
                console.log(`      ${a.agent_name}: ${a.total_runs} runs, ${a.successes} success`);
            });
        }

        console.log('\n📊 Phase 2 Status:');
        const allGood = !ar_error && !att_error && !func_error && !view_error;

        if (allGood) {
            console.log('   ✅ FULLY OPERATIONAL');
            console.log('   ✅ Ready for Phase 3');
        } else {
            console.log('   ⚠️  Some components need attention');
        }

        return allGood;

    } catch (err) {
        console.error('❌ Verification failed:', err.message);
        return false;
    }
}

verifyPhase2().then(success => {
    process.exit(success ? 0 : 1);
});
