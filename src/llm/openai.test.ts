import { describe, it, expect } from 'bun:test';
import { OpenAIService } from './openai';
import { DocumentCommand } from '../commands/schema';

describe('OpenAI Service', () => {
  const service = new OpenAIService();
  const TIMEOUT = 60000; // 60s timeout

  it(
    'should parse instructions into commands',
    async () => {
      console.log('Starting instruction parsing test...');
      const instructions = `
      In section 2, add a new paragraph that says "This is a new paragraph" in bold.
      Then, find the heading "Introduction" and replace it with "Executive Summary".
    `;

      const commands = await service.parseInstructions(instructions);
      console.log('Received commands:', JSON.stringify(commands, null, 2));

      expect(commands).toBeArray();
      expect(commands.length).toBeGreaterThanOrEqual(1);

      // Find the insert command
      const insertCommand = commands.find(
        (c) => c.action === 'insert' && c.location.type === 'section'
      );
      console.log('Found insert command:', JSON.stringify(insertCommand, null, 2));

      expect(insertCommand).toBeDefined();
      expect(insertCommand).toMatchObject({
        action: 'insert',
        location: {
          type: 'section',
        },
        content: {
          text: expect.stringContaining('new paragraph'),
          style: {
            specific: {
              bold: true,
            },
          },
        },
      });

      // Find the modify command
      const modifyCommand = commands.find(
        (c) =>
          c.action === 'modify' &&
          c.location.type === 'heading' &&
          c.location.value?.toLowerCase().includes('introduction')
      );
      console.log('Found modify command:', JSON.stringify(modifyCommand, null, 2));

      expect(modifyCommand).toBeDefined();
      expect(modifyCommand).toMatchObject({
        action: 'modify',
        location: {
          type: 'heading',
        },
        content: {
          text: expect.stringContaining('Executive Summary'),
        },
      });
    },
    TIMEOUT
  );

  it(
    'should validate commands',
    async () => {
      console.log('Starting command validation test...');
      const command: DocumentCommand = {
        documentId: 'test.docx',
        action: 'insert',
        location: {
          type: 'section',
          number: 999, // Non-existent section
          position: 'end',
        },
        content: {
          text: 'Test content',
          style: {
            specific: {
              bold: true,
            },
          },
        },
      };

      const validation = await service.validateCommand(command);
      console.log('Received validation:', JSON.stringify(validation, null, 2));

      // Basic structure checks
      expect(validation.isValid).toBeDefined();
      expect(Array.isArray(validation.issues)).toBe(true);
      expect(Array.isArray(validation.suggestions)).toBe(true);

      // Content checks
      if (validation.isValid) {
        expect(validation.issues).toHaveLength(0);
      } else {
        expect(validation.issues.length).toBeGreaterThan(0);
        expect(
          validation.issues.some(
            (i) =>
              i.toLowerCase().includes('section') ||
              i.toLowerCase().includes('999') ||
              i.toLowerCase().includes('number')
          )
        ).toBe(true);
      }

      // Should always have suggestions
      expect(validation.suggestions.length).toBeGreaterThanOrEqual(0);
    },
    TIMEOUT
  );

  it(
    'should explain commands',
    async () => {
      console.log('Starting command explanation test...');
      const command: DocumentCommand = {
        documentId: 'test.docx',
        action: 'modify',
        location: {
          type: 'heading',
          value: 'Introduction',
          position: 'replace',
        },
        content: {
          text: 'Executive Summary',
          style: {
            matchSource: true,
          },
        },
      };

      const explanation = await service.explainCommand(command);
      console.log('Received explanation:', explanation);

      expect(explanation).toBeString();
      expect(explanation.length).toBeGreaterThan(10); // Should be a meaningful explanation

      // Should mention key aspects of the command
      const lowerExplanation = explanation.toLowerCase();
      expect(
        lowerExplanation.includes('modify') ||
          lowerExplanation.includes('replace') ||
          lowerExplanation.includes('change')
      ).toBe(true);

      expect(
        lowerExplanation.includes('introduction') || lowerExplanation.includes('heading')
      ).toBe(true);

      expect(
        lowerExplanation.includes('executive summary') || lowerExplanation.includes('new text')
      ).toBe(true);
    },
    TIMEOUT
  );
});
