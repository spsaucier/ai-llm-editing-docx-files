import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Processor } from '.';
import { DocumentCommand } from '../commands/schema';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';

describe('Document Processor', () => {
  const processor = new Processor();
  const testDocPath = join(processor.tempDir, 'test.docx');
  let testDocBase64: string;

  // Helper to run Python script
  const runPython = async (): Promise<void> => {
    const pythonScript = `
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document()

# Add heading
heading = doc.add_heading('Heading 1', level=1)

# Add sections
doc.add_paragraph('This is section 1.')

section1 = doc.add_paragraph()
section1.add_run('1. First Section\\n').bold = True
section1.add_run('This is the content of section 1.')

section2 = doc.add_paragraph()
section2.add_run('2. Second Section\\n').bold = True
section2.add_run('This is the content of section 2.')

section3 = doc.add_paragraph()
section3.add_run('3. Third Section\\n').bold = True
section3.add_run('This is the content of section 3.')

doc.save('${testDocPath}')
`;

    await writeFile('temp_script.py', pythonScript);
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('.venv/bin/python3', ['temp_script.py']);
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Python script failed with code ${code}`));
      });
    });
    await unlink('temp_script.py');
  };

  beforeAll(async () => {
    await mkdir(processor.tempDir, { recursive: true });
    await runPython();
    const docBuffer = await Bun.file(testDocPath).arrayBuffer();
    testDocBase64 = Buffer.from(docBuffer).toString('base64');
  });

  afterAll(async () => {
    await unlink(testDocPath).catch(() => {});
  });

  it('should process insert command', async () => {
    const command: DocumentCommand = {
      documentId: testDocBase64,
      action: 'insert',
      location: {
        type: 'section',
        number: '2',
        position: 'end',
      },
      content: {
        text: 'New content',
        style: {
          specific: {
            bold: true,
          },
        },
      },
    };

    const result = await processor.processCommand(command);
    expect(result).toBeDefined();
  });

  it('should process modify command', async () => {
    const command: DocumentCommand = {
      documentId: testDocBase64,
      action: 'modify',
      location: {
        type: 'heading',
        value: 'Heading 1',
        position: 'replace',
      },
      content: {
        text: 'New Heading',
        style: {
          matchSource: true,
        },
      },
    };

    const result = await processor.processCommand(command);
    expect(result).toBeDefined();
  });

  it('should process delete command', async () => {
    const command: DocumentCommand = {
      documentId: testDocBase64,
      action: 'delete',
      location: {
        type: 'section',
        number: '3',
        position: 'start',
      },
    };

    const result = await processor.processCommand(command);
    expect(result).toBeDefined();
  });

  it('should validate pre-conditions', async () => {
    const command: DocumentCommand = {
      documentId: testDocBase64,
      action: 'insert',
      location: {
        type: 'section',
        number: '2',
        position: 'end',
      },
      content: {
        text: 'New content',
        style: {
          specific: {
            bold: true,
          },
        },
      },
      validation: {
        preConditions: {
          mustExist: ['Second Section'],
          mustNotExist: ['Fourth Section'],
        },
      },
    };

    const result = await processor.processCommand(command);
    expect(result).toBeDefined();
  });

  it('should handle complex location specifiers', async () => {
    const command: DocumentCommand = {
      documentId: testDocBase64,
      action: 'insert',
      location: {
        type: 'sentence',
        section: '2',
        matchText: 'content of section 2',
        position: 'after',
      },
      content: {
        text: 'New sentence',
        style: {
          specific: {
            italic: true,
          },
        },
      },
    };

    const result = await processor.processCommand(command);
    expect(result).toBeDefined();
  });
});
