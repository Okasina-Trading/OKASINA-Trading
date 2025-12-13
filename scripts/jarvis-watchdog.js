import { spawn, exec } from 'child_process';
import http from 'http';
import net from 'net';

const PORTS = {
    FRONTEND: 5173,
    BACKEND: 3001
};

const COMMANDS = {
    FRONTEND: 'npm run dev',
    BACKEND: 'node server.js'
};

const PROCESSES = {
    FRONTEND: null,
    BACKEND: null
};

// Logger
const log = (msg) => console.log(`[WATCHDOG] ${new Date().toLocaleTimeString()} - ${msg}`);

// Check if a port is in use
const checkPort = (port) => new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
        socket.destroy();
        resolve(true); // Port is open (service running)
    });
    socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
    });
    socket.on('error', () => {
        resolve(false);
    });
    socket.connect(port, '127.0.0.1');
});

// Start a service
const startService = (name, command) => {
    log(`Starting ${name}...`);
    const [cmd, ...args] = command.split(' ');

    const proc = spawn(cmd, args, {
        shell: true,
        stdio: 'inherit',
        cwd: process.cwd()
    });

    PROCESSES[name] = proc;

    proc.on('close', (code) => {
        log(`${name} stopped with code ${code}`);
        PROCESSES[name] = null;
    });
};

// Monitoring Loop
const monitor = async () => {
    // Check Frontend
    const frontendAlive = await checkPort(PORTS.FRONTEND);
    if (!frontendAlive && !PROCESSES.FRONTEND) {
        log(`Frontend (Port ${PORTS.FRONTEND}) is down. Restarting...`);
        startService('FRONTEND', COMMANDS.FRONTEND);
    }

    // Check Backend
    const backendAlive = await checkPort(PORTS.BACKEND);
    if (!backendAlive && !PROCESSES.BACKEND) {
        log(`Backend (Port ${PORTS.BACKEND}) is down. Restarting...`);
        startService('BACKEND', COMMANDS.BACKEND);
    }
};

// Start Watchdog
log('Starting System Watchdog...');
setInterval(monitor, 5000); // Check every 5 seconds
monitor(); // Initial check

// Handle Exit
process.on('SIGINT', () => {
    log('Stopping Watchdog and Child Processes...');
    if (PROCESSES.FRONTEND) PROCESSES.FRONTEND.kill();
    if (PROCESSES.BACKEND) PROCESSES.BACKEND.kill();
    process.exit();
});
