
import { createClient } from '@supabase/supabase-js';

// Hardcoded env from src/utils/env.js to ensure we test the exact same config
const url = "https://hthkrbtwfymaxtnvshfz.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aGtyYnR3ZnltYXh0bnZzaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTQ1ODMsImV4cCI6MjA4MTIzMDU4M30.EMVEObVRAOe3cuQ7mRGiB4pPqLQwdkuiCQisNlJdiio";

const supabase = createClient(url, key);

async function checkUser() {
    console.log("Checking status for omranahmad@yahoo.com...");

    // Attempt sign in with a dummy password. 
    // If user exists but not confirmed, Supabase usually returns "Email not confirmed"
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'omranahmad@yahoo.com',
        password: 'dummy_wrong_password_123'
    });

    if (error) {
        console.log("Result:", error.message);
        if (error.message.includes("Email not confirmed")) {
            console.log("CONCLUSION: User EXISTS but is UNCONFIRMED.");
        } else if (error.message.includes("Invalid login credentials")) {
            console.log("CONCLUSION: User EXISTS and is CONFIRMED (but we used wrong password) OR User does NOT exist (Supabase prevents enumeration).");
            // To distinguish, we can try to signup. If it says "User already registered", then they exist.
            await checkSignup();
        } else {
            console.log("CONCLUSION: Unknown state.");
        }
    } else {
        console.log("Success? (Should not happen with dummy password)");
    }
}

async function checkSignup() {
    console.log("\nAttempting duplicate signup to verify existence...");
    const { data, error } = await supabase.auth.signUp({
        email: 'omranahmad@yahoo.com',
        password: 'Password123!',
    });

    if (error) {
        console.log("Signup Result:", error.message);
    } else {
        // If successful (and returns user), it might mean they didn't exist, OR Supabase just sent another confirmation email.
        console.log("Signup accepted. User might be receiving a new confirmation email now.");
        console.log("User ID:", data.user?.id);
        console.log("Identities:", data.user?.identities);

        if (data.user?.identities?.length === 0) {
            console.log("CONCLUSION: User already exists.");
        } else {
            console.log("CONCLUSION: New user created.");
        }
    }
}

checkUser();
