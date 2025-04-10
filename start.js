const { spawn } = require('child_process');

// Start the server
const serverProcess = spawn('node', ['index.js'], { stdio: 'inherit' });

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});