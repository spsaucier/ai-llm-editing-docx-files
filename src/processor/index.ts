import { ProcessingJob, DocumentCommand } from '../types';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';

export class Processor {
  private pythonPath: string;
  private processorPath: string;
  private commandProcessorPath: string;
  private _tempDir: string;

  constructor() {
    this.pythonPath = '.venv/bin/python3';
    this.processorPath = join(process.cwd(), 'src/processor/processor.py');
    this.commandProcessorPath = join(process.cwd(), 'src/processor/command_processor.py');
    this._tempDir = join(process.cwd(), 'temp');
  }

  get tempDir(): string {
    return this._tempDir;
  }

  async processCommand(command: DocumentCommand): Promise<string> {
    const tempPath = join(this._tempDir, `${randomUUID()}.docx`);

    try {
      // Write temp file from base64 document
      await writeFile(tempPath, Buffer.from(command.documentId, 'base64'));

      // Run Python command processor
      const proc = Bun.spawn([
        this.pythonPath,
        this.commandProcessorPath,
        tempPath,
        JSON.stringify(command),
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

  // Keep legacy process method for backward compatibility
  async process(job: ProcessingJob): Promise<string> {
    // Convert legacy job to command
    const command: DocumentCommand = {
      documentId: job.document,
      action: 'insert',
      location: {
        type: 'section',
        number: job.targetSection,
        position: 'end',
      },
      content: {
        text: job.clause,
        style: {
          specific: {
            bold: job.formatting.bold,
            underline: job.formatting.underline,
          },
        },
      },
    };

    return this.processCommand(command);
  }
}
