import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Orchestrator } from '.';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';

describe('Orchestrator', () => {
  const orchestrator = new Orchestrator();
  const testDir = join(process.cwd(), 'test-documents');
  const tempDir = join(process.cwd(), 'temp');
  const instructionsPath = join(testDir, 'test-instructions.docx');

  beforeAll(async () => {
    console.log('Setting up test environment...');
    // Create directories
    await mkdir(testDir, { recursive: true });
    await mkdir(tempDir, { recursive: true });

    // Create test instruction document
    const instructionsScript = `
from docx import Document
from docx.shared import RGBColor

doc = Document()

# Add contract 1
p = doc.add_paragraph()
run = p.add_run('Contract 1')
run.bold = True
run = p.add_run(' Replace "ABCCorp" with "XYZTech" throughout the document')
run.font.color.rgb = RGBColor(0, 0, 255)

# Add clause for contract 1
p = doc.add_paragraph('XYZTech')

# Add contract 2
p = doc.add_paragraph()
run = p.add_run('Contract 2')
run.bold = True

# Add instruction for contract 2
p = doc.add_paragraph()
run = p.add_run('Replace "Yellowpad AI Inc." with "Acme Corp"')
run.font.color.rgb = RGBColor(0, 0, 255)

# Add clause for contract 2
p = doc.add_paragraph('Acme Corp')

doc.save('${instructionsPath}')
`;

    // Create and run Python script
    await writeFile('temp_instructions.py', instructionsScript);
    const proc = Bun.spawn(['.venv/bin/python3', 'temp_instructions.py']);
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      throw new Error(`Python script failed with code ${exitCode}`);
    }
    await unlink('temp_instructions.py');
    console.log('Test environment setup complete');
  });

  afterAll(async () => {
    await unlink(instructionsPath).catch(() => {});
  });

  it('should process instruction document', async () => {
    console.log('Starting instruction document processing test...');
    const results = await orchestrator.processInstructionDocument(instructionsPath);
    console.log('Processing results:', JSON.stringify(results, null, 2));

    expect(results).toBeArray();
    expect(results.length).toBe(2);

    // Check Contract 1 result
    const contract1 = results[0];
    console.log('Contract 1 result:', JSON.stringify(contract1, null, 2));
    expect(contract1.status).toBe('completed');
    expect(contract1.result?.document).toBeDefined();
    expect(contract1.result?.changes?.[0].type).toBe('replace');
    expect(contract1.result?.changes?.[0].text).toBe('XYZTech');
    expect(contract1.result?.changes?.[0].oldText).toBe('ABCCorp');

    // Check Contract 2 result
    const contract2 = results[1];
    console.log('Contract 2 result:', JSON.stringify(contract2, null, 2));
    expect(contract2.status).toBe('completed');
    expect(contract2.result?.document).toBeDefined();
    expect(contract2.result?.changes?.[0].type).toBe('replace');
    expect(contract2.result?.changes?.[0].text).toBe('Acme Corp');
    expect(contract2.result?.changes?.[0].oldText).toBe('Yellowpad AI Inc.');
  }, 60000); // 60s timeout for LLM calls
});
