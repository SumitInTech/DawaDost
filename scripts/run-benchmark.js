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

const args = [path.join('backend', 'scripts', 'benchmark_test_set.py')];
const proc = spawn(py, args, {
  stdio: 'inherit',
});

proc.on('exit', (code) => process.exit(code || 0));
