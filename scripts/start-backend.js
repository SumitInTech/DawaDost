import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const isWin = process.platform === 'win32';
const venvPyWin = path.join('backend', '.venv', 'Scripts', 'python.exe');
const venvPyNix = path.join('backend', '.venv', 'bin', 'python');

let py = 'python';
if (isWin && fs.existsSync(venvPyWin)) {
  py = venvPyWin;
} else if (!isWin && fs.existsSync(venvPyNix)) {
  py = venvPyNix;
}

const reloadDir = path.join('backend', 'app');
const args = ['-m', 'uvicorn', 'app.main:app', '--app-dir', 'backend', '--reload', '--reload-dir', reloadDir, '--port', '8000'];
const proc = spawn(py, args, {
  stdio: 'inherit',
});

proc.on('exit', (code) => process.exit(code || 0));
