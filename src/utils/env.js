
export function getEnv() {
    // Hardcoded to fix persistent build environment issue
    const url = "https://hthkrbtwfymaxtnvshfz.supabase.co";
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aGtyYnR3ZnltYXh0bnZzaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTQ1ODMsImV4cCI6MjA4MTIzMDU4M30.EMVEObVRAOe3cuQ7mRGiB4pPqLQwdkuiCQisNlJdiio";

    if (!url || !key) {
        console.error("Critical: Missing Supabase Environment Variables!");
        throw new Error("Missing Supabase env. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.");
    }
    return { url, key };
}
