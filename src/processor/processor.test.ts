import { describe, it, expect } from 'bun:test';
import { Processor } from './index';
import { readFile } from 'fs/promises';
import { join } from 'path';

describe('Document Processor', () => {
  it('should process a document', async () => {
    const processor = new Processor();
    const testDoc = await readFile(join(__dirname, 'test.docx'));

    const result = await processor.process({
      id: 'test-job-1',
      document: testDoc.toString('base64'),
      clause: 'Test clause insertion',
      targetSection: 'section1',
      formatting: {
        bold: true,
        underline: false,
      },
    });

    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');

    // Write result for manual inspection
    await Bun.write('test-output.docx', Buffer.from(result, 'base64'));
  });
});
