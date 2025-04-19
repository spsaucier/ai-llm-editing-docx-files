import { describe, test, expect } from 'bun:test';
import { DocumentCommand } from './schema';
import { validateCommand, CommandValidationError } from './validator';

describe('Command Validation', () => {
  test('should validate a valid insert command', () => {
    const command: DocumentCommand = {
      documentId: 'Contract1.docx',
      action: 'insert',
      location: {
        type: 'heading',
        value: 'Definitions',
        position: 'after',
      },
      content: {
        text: '"Affiliate" means any entity...',
        style: {
          matchSource: true,
          specific: {
            bold: false,
          },
        },
      },
    };

    expect(() => validateCommand(command)).not.toThrow();
  });

  test('should validate a valid modify command', () => {
    const command: DocumentCommand = {
      documentId: 'Contract2.docx',
      action: 'modify',
      location: {
        type: 'sentence',
        section: '11',
        matchText: 'first sentence',
        position: 'after',
      },
      content: {
        text: 'The Disclosing Party makes no representations...',
        style: {
          matchSource: true,
        },
      },
    };

    expect(() => validateCommand(command)).not.toThrow();
  });

  test('should validate a valid delete command', () => {
    const command: DocumentCommand = {
      documentId: 'Contract3.docx',
      action: 'delete',
      location: {
        type: 'section',
        number: '10',
        position: 'end',
      },
    };

    expect(() => validateCommand(command)).not.toThrow();
  });

  test('should reject command without documentId', () => {
    const command: any = {
      action: 'insert',
      location: {
        type: 'heading',
        value: 'Definitions',
        position: 'after',
      },
    };

    expect(() => validateCommand(command)).toThrow(CommandValidationError);
  });

  test('should reject insert command without content', () => {
    const command: DocumentCommand = {
      documentId: 'Contract1.docx',
      action: 'insert',
      location: {
        type: 'heading',
        value: 'Definitions',
        position: 'after',
      },
    };

    expect(() => validateCommand(command)).toThrow(CommandValidationError);
  });

  test('should reject invalid color format', () => {
    const command: DocumentCommand = {
      documentId: 'Contract1.docx',
      action: 'insert',
      location: {
        type: 'heading',
        value: 'Definitions',
        position: 'after',
      },
      content: {
        text: 'Some text',
        style: {
          specific: {
            color: 'red', // Should be hex
          },
        },
      },
    };

    expect(() => validateCommand(command)).toThrow(CommandValidationError);
  });

  test('should reject negative spacing values', () => {
    const command: DocumentCommand = {
      documentId: 'Contract1.docx',
      action: 'insert',
      location: {
        type: 'heading',
        value: 'Definitions',
        position: 'after',
      },
      content: {
        text: 'Some text',
        style: {
          specific: {
            spacing: {
              before: -100,
            },
          },
        },
      },
    };

    expect(() => validateCommand(command)).toThrow(CommandValidationError);
  });
});
