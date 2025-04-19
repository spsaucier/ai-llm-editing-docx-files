import { ProcessingJob } from '../types';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';

export class Processor {
  private pythonPath: string;
  private processorPath: string;
  private tempDir: string;

  constructor() {
    this.pythonPath = '.venv/bin/python3';
    this.processorPath = join(process.cwd(), 'src/processor/processor.py');
    this.tempDir = join(process.cwd(), 'temp');
  }

  async process(job: ProcessingJob): Promise<string> {
    const tempPath = join(this.tempDir, `${randomUUID()}.docx`);

    try {
      // Write temp file
      await writeFile(tempPath, Buffer.from(job.document, 'base64'));

      // Run Python processor
      const formatting = JSON.stringify({
        bold: job.formatting.bold,
        underline: job.formatting.underline,
      });

      const proc = Bun.spawn([
        this.pythonPath,
        this.processorPath,
        tempPath,
        job.clause,
        job.targetSection,
        formatting,
      ]);

      const output = await new Response(proc.stdout).text();
      const result = JSON.parse(output);

      if (result.status === 'error') {
        throw new Error(result.message);
      }

      // Read processed file
      const processedDoc = await Bun.file(tempPath).arrayBuffer();
      return Buffer.from(processedDoc).toString('base64');
    } finally {
      // Cleanup
      await unlink(tempPath).catch(() => {});
    }
  }
}
