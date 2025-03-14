// This script compiles and runs the TypeScript initialization script

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// First, compile the TypeScript file
console.log('Compiling TypeScript file...');

exec('npx tsc -p tsconfig.json src/scripts/init-workflow-tasks.ts --outDir dist', (error, stdout, stderr) => {
  if (error) {
    console.error(`Compilation error: ${error.message}`);
    console.error(stderr);
    return;
  }
  
  if (stderr) {
    console.error(`Compilation warning: ${stderr}`);
  }
  
  console.log('TypeScript compilation complete.');
  
  // Now run the compiled JavaScript file
  console.log('Running initialization script...');
  
  const scriptPath = path.resolve(__dirname, '../../dist/src/scripts/init-workflow-tasks.js');
  
  if (!fs.existsSync(scriptPath)) {
    console.error(`Compiled script not found at ${scriptPath}`);
    return;
  }
  
  exec(`node ${scriptPath}`, (runError, runStdout, runStderr) => {
    if (runError) {
      console.error(`Runtime error: ${runError.message}`);
      console.error(runStderr);
      return;
    }
    
    console.log(runStdout);
    
    if (runStderr) {
      console.error(`Runtime warning: ${runStderr}`);
    }
    
    console.log('Initialization complete!');
  });
}); 