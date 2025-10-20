import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

// MCP Server process management
let mcpServerProcess: ChildProcess | null = null;
let mcpServerStatus: 'running' | 'stopped' | 'starting' | 'stopping' = 'stopped';

export function getMcpServerStatus(): 'running' | 'stopped' | 'starting' | 'stopping' {
	return mcpServerStatus;
}

export function startMcpServer(extensionPath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		if (mcpServerProcess) {
			resolve(); // Already running
			return;
		}

		mcpServerStatus = 'starting';

		try {
			// Path to the MCP server script
			const serverScript = path.join(extensionPath, 'out', 'mcpServer.js');

			// Start the MCP server process
			mcpServerProcess = spawn('node', [serverScript], {
				stdio: ['pipe', 'pipe', 'pipe'],
				cwd: extensionPath
			});

			mcpServerProcess.on('spawn', () => {
				mcpServerStatus = 'running';
				resolve();
			});

			mcpServerProcess.on('error', (error) => {
				console.error('[MCP] Server process error:', error);
				mcpServerProcess = null;
				mcpServerStatus = 'stopped';
				reject(error);
			});

			mcpServerProcess.on('exit', (_code) => {
				mcpServerProcess = null;
				mcpServerStatus = 'stopped';
			});

			// Handle stdout/stderr for logging
			mcpServerProcess.stdout?.on('data', (data) => {
				console.log(`MCP Server: ${data.toString().trim()}`);
			});

			mcpServerProcess.stderr?.on('data', (data) => {
				console.error(`MCP Server Error: ${data.toString().trim()}`);
			});

		} catch (error) {
			console.error('[MCP] Failed to start server:', error);
			mcpServerStatus = 'stopped';
			reject(error);
		}
	});
}

export function stopMcpServer(): Promise<void> {
	return new Promise((resolve) => {
		if (!mcpServerProcess) {
			resolve(); // Already stopped
			return;
		}

		mcpServerStatus = 'stopping';

		mcpServerProcess.kill('SIGTERM');

		// Give it 5 seconds to gracefully shutdown
		const timeout = setTimeout(() => {
			if (mcpServerProcess) {
				mcpServerProcess.kill('SIGKILL');
			}
		}, 5000);

		mcpServerProcess.on('exit', (_code, _signal) => {
			clearTimeout(timeout);
			mcpServerProcess = null;
			mcpServerStatus = 'stopped';
			resolve();
		});

		mcpServerProcess.on('error', (error) => {
			console.error('[MCP] Process error during stop:', error);
		});
	});
}

export function restartMcpServer(extensionPath: string): Promise<void> {
	return stopMcpServer().then(() => startMcpServer(extensionPath));
}