import { describe, it, expect, beforeAll } from 'bun:test';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { ProcessingStatus } from '../types/index';

describe('API', () => {
  const baseUrl = 'http://localhost:3000';
  let testDoc: Buffer;

  beforeAll(async () => {
    testDoc = await readFile(join(process.cwd(), 'src/processor/test.docx'));
  });

  it('should return OK for health check', async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('OK');
  });

  it('should return metrics', async () => {
    const response = await fetch(`${baseUrl}/metrics`);
    expect(response.status).toBe(200);
    const metrics = await response.json();
    expect(metrics).toBeDefined();
  });

  it('should process a document', async () => {
    const formData = new FormData();
    const file = new File([testDoc], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    formData.append('document', file);
    formData.append('clause', 'Test clause');
    formData.append('targetSection', 'section1');
    formData.append('formatting', JSON.stringify({ bold: true, underline: false }));

    const response = await fetch(`${baseUrl}/documents`, {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(202);
    const result = (await response.json()) as ProcessingStatus;
    expect(result.id).toBeDefined();
    expect(result.status).toBe('processing');

    // Check status
    const statusResponse = await fetch(`${baseUrl}/documents/${result.id}`);
    expect(statusResponse.status).toBe(200);
    const status = (await statusResponse.json()) as ProcessingStatus;
    expect(status.id).toBe(result.id);
    expect(['processing', 'completed', 'failed'] as const).toContain(status.status);
  });

  it('should handle invalid document upload', async () => {
    const formData = new FormData();
    formData.append('clause', 'Test clause');
    formData.append('targetSection', 'section1');

    const response = await fetch(`${baseUrl}/documents`, {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(400);
    const result = (await response.json()) as { error: string };
    expect(result.error).toBe('Document must be a file');
  });

  it('should handle non-existent document status', async () => {
    const response = await fetch(`${baseUrl}/documents/non-existent-id`);
    expect(response.status).toBe(404);
    const result = (await response.json()) as { error: string };
    expect(result.error).toBe('Document not found');
  });
});
