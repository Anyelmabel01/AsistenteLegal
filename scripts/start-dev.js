#!/usr/bin/env node
const { spawn, exec } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3001;

console.log(`🚀 Starting development server on port ${PORT}...`);

// Function to kill process on specific port
function killPort(port) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' 
      ? `netstat -ano | findstr :${port}`
      : `lsof -ti:${port}`;
    
    exec(command, (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log(`✅ Port ${port} is available`);
        resolve();
        return;
      }

      if (process.platform === 'win32') {
        // Windows: Extract PID from netstat output
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parts[4];
            if (pid && pid !== '0') {
              pids.add(pid);
            }
          }
        });

        if (pids.size > 0) {
          console.log(`🔄 Killing processes on port ${port}: ${Array.from(pids).join(', ')}`);
          pids.forEach(pid => {
            exec(`taskkill /PID ${pid} /F`, (error) => {
              if (error) {
                console.log(`⚠️ Could not kill PID ${pid}: ${error.message}`);
              } else {
                console.log(`✅ Successfully killed PID ${pid}`);
              }
            });
          });
        }
      } else {
        // Unix/Linux/Mac: Kill process directly
        exec(`kill -9 ${stdout.trim()}`, (error) => {
          if (error) {
            console.log(`⚠️ Could not kill process: ${error.message}`);
          } else {
            console.log(`🔄 Killed process on port ${port}`);
          }
        });
      }
      
      setTimeout(resolve, 1000); // Wait 1 second for cleanup
    });
  });
}

// Main function
async function startDev() {
  try {
    // Kill any existing processes on development ports
    await killPort(PORT);
    await killPort(8000); // Also clear 8000 in case it's still occupied
    
    console.log(`🎯 Starting Next.js development server...`);
    
    // Start Next.js development server
    const nextProcess = spawn('npx', ['next', 'dev', '-p', PORT], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    // Handle process cleanup
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      nextProcess.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down development server...');
      nextProcess.kill('SIGTERM');
      process.exit(0);
    });

    nextProcess.on('close', (code) => {
      console.log(`\n📝 Development server exited with code ${code}`);
      process.exit(code);
    });

  } catch (error) {
    console.error('❌ Error starting development server:', error);
    process.exit(1);
  }
}

startDev();