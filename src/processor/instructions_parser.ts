import { join } from 'path';
import { spawn } from 'child_process';

export interface Instruction {
  contract: string;
  instruction: string;
  clause: string;
}

export async function parse_instructions(docPath: string): Promise<Instruction[]> {
  const pythonPath = '.venv/bin/python3';
  const parserPath = join(process.cwd(), 'src/processor/instructions_parser.py');

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonPath, [parserPath, docPath]);
    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      console.error(`Parser error: ${data}`);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Parser exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(output));
      } catch (error) {
        reject(new Error(`Failed to parse instructions: ${error}`));
      }
    });
  });
}
