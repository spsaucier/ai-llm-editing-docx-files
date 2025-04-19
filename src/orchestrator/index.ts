import { OpenAIService } from '../llm/openai';
import { Processor } from '../processor';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { parse_instructions } from '../processor/instructions_parser';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Change } from '../types';

export interface ProcessingResult {
  id: string;
  status: 'completed' | 'failed';
  result?: {
    document?: string;
    error?: string;
    changes?: Change[];
  };
}

export class Orchestrator {
  private llm: OpenAIService;
  private processor: Processor;

  constructor() {
    this.llm = new OpenAIService();
    this.processor = new Processor();
  }

  async processInstructionDocument(instructionDocPath: string): Promise<ProcessingResult[]> {
    try {
      logger.info({ path: instructionDocPath }, 'Starting instruction document processing');
      metrics.increment('instruction_processing_total');

      // Parse instructions
      const instructions = await parse_instructions(instructionDocPath);
      logger.info({ count: instructions.length, instructions }, 'Parsed instructions');

      const results: ProcessingResult[] = [];

      // Process each instruction
      for (const instruction of instructions) {
        const id = `${instruction.contract}-${Date.now()}`;
        try {
          // Read contract document
          const contractPath = join(process.cwd(), 'test-documents', instruction.contract);
          logger.info({ id, contractPath }, 'Reading contract document');
          const contractBuffer = await readFile(contractPath);
          const contractBase64 = contractBuffer.toString('base64');

          // Generate commands from instruction
          logger.info({ id, instruction: instruction.instruction }, 'Generating commands');
          const commands = await this.llm.parseInstructions(instruction.instruction);
          logger.info({ id, commandCount: commands.length, commands }, 'Generated commands');

          // Validate each command
          for (const command of commands) {
            logger.info({ id, command }, 'Validating command');
            const validation = await this.llm.validateCommand(command);
            if (!validation.isValid) {
              logger.error({ id, validation }, 'Command validation failed');
              throw new Error(`Invalid command: ${validation.issues.join(', ')}`);
            }
          }

          // Execute commands
          let processedDoc = contractBase64;
          const changes: Change[] = [];
          for (const command of commands) {
            logger.info({ id, command }, 'Executing command');
            processedDoc = await this.processor.processCommand({
              ...command,
              documentId: processedDoc,
            });

            // Track changes
            if (command.action === 'modify' && command.content) {
              changes.push({
                type: 'replace',
                text: command.content.text,
                oldText: command.location.matchText || command.location.value,
              });
            } else if (command.action === 'insert' && command.content) {
              changes.push({
                type: 'add',
                text: command.content.text,
                section: command.location.number?.toString(),
              });
            }
          }

          results.push({
            id,
            status: 'completed',
            result: {
              document: processedDoc,
              changes,
            },
          });

          logger.info({ id }, 'Successfully processed instruction');
          metrics.increment('instruction_processed_total', { status: 'success' });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error({ id, error: errorMessage, instruction }, 'Failed to process instruction');
          results.push({
            id,
            status: 'failed',
            result: {
              error: errorMessage,
            },
          });

          metrics.increment('instruction_processed_total', { status: 'error' });
        }
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: errorMessage }, 'Failed to process instruction document');
      metrics.increment('instruction_processing_total', { status: 'error' });
      throw error;
    }
  }
}
