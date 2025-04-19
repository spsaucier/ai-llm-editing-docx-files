import {
  DocumentCommand,
  LocationSpecifier,
  ContentSpecification,
  StyleRequirements,
} from './schema';

export class CommandValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommandValidationError';
  }
}

export function validateLocation(location: LocationSpecifier): void {
  if (!location.type || !location.position) {
    throw new CommandValidationError('Location must specify type and position');
  }

  switch (location.type) {
    case 'heading':
      if (!location.value) {
        throw new CommandValidationError('Heading location must specify value');
      }
      break;
    case 'section':
      if (!location.number) {
        throw new CommandValidationError('Section location must specify number');
      }
      break;
    case 'sentence':
      if (!location.matchText && !location.sentenceNumber) {
        throw new CommandValidationError(
          'Sentence location must specify either matchText or sentenceNumber'
        );
      }
      break;
    case 'paragraph':
      if (!location.matchText && !location.paragraphNumber) {
        throw new CommandValidationError(
          'Paragraph location must specify either matchText or paragraphNumber'
        );
      }
      break;
    default:
      throw new CommandValidationError(`Unknown location type: ${(location as any).type}`);
  }
}

export function validateStyle(style: StyleRequirements): void {
  if (style.specific) {
    // Validate spacing if provided
    if (style.specific.spacing) {
      const { before, after, line } = style.specific.spacing;
      if (before && before < 0)
        throw new CommandValidationError('Spacing before must be non-negative');
      if (after && after < 0)
        throw new CommandValidationError('Spacing after must be non-negative');
      if (line && line < 0) throw new CommandValidationError('Line spacing must be non-negative');
    }

    // Validate color format if provided
    if (style.specific.color && !/^#[0-9A-F]{6}$/i.test(style.specific.color)) {
      throw new CommandValidationError('Color must be in hex format (e.g., #FF0000)');
    }
  }
}

export function validateContent(content: ContentSpecification): void {
  if (!content.text) {
    throw new CommandValidationError('Content must specify text');
  }

  if (content.style) {
    validateStyle(content.style);
  }
}

export function validateCommand(command: DocumentCommand): void {
  // Validate basic structure
  if (!command.documentId) {
    throw new CommandValidationError('Command must specify documentId');
  }

  if (!command.action) {
    throw new CommandValidationError('Command must specify action');
  }

  // Validate location
  validateLocation(command.location);

  // Validate content for insert/modify actions
  if ((command.action === 'insert' || command.action === 'modify') && !command.content) {
    throw new CommandValidationError(`${command.action} action requires content`);
  }

  if (command.content) {
    validateContent(command.content);
  }

  // Validate conditions if present
  if (command.validation) {
    const { preConditions, postConditions } = command.validation;

    if (preConditions) {
      if (preConditions.mustExist && !Array.isArray(preConditions.mustExist)) {
        throw new CommandValidationError('mustExist must be an array');
      }
      if (preConditions.mustNotExist && !Array.isArray(preConditions.mustNotExist)) {
        throw new CommandValidationError('mustNotExist must be an array');
      }
    }

    if (postConditions) {
      if (postConditions.shouldExist && !Array.isArray(postConditions.shouldExist)) {
        throw new CommandValidationError('shouldExist must be an array');
      }
      if (postConditions.shouldNotExist && !Array.isArray(postConditions.shouldNotExist)) {
        throw new CommandValidationError('shouldNotExist must be an array');
      }
    }
  }
}
