
async function testImport() {
    try {
        console.log("Attempting to import server.js...");
        const module = await import('../server.js');
        console.log("SUCCESS: server.js imported.");
        if (module.default) {
            console.log("SUCCESS: App exported.");
        } else {
            console.error("FAIL: No default export.");
        }
    } catch (err) {
        console.error("FATAL: Failed to import server.js");
        console.error(err);
    }
}

testImport();
