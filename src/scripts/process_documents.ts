import { join } from 'path';
import { Orchestrator } from '../orchestrator';
import { writeFile } from 'fs/promises';
import { logger } from '../utils/logger';

async function processDocuments() {
  const orchestrator = new Orchestrator();
  const instructionsPath = join(
    process.cwd(),
    'test-documents',
    'Instructions and Snippets of Text.docx'
  );
  const outputDir = join(process.cwd(), 'test-documents-updated');

  try {
    logger.info('Starting document processing');

    // Process instructions and get results
    const results = await orchestrator.processInstructionDocument(instructionsPath);

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      processed: [] as any[],
      failed: [] as any[],
    };

    // Save processed documents and collect report
    for (const result of results) {
      if (result.status === 'completed' && result.result?.document) {
        // Extract contract name without extension and add .docx
        const contractName = result.id.split('-')[0].replace(/\.docx$/, '');
        const outputPath = join(outputDir, `${contractName}.docx`);

        // Save document
        const docBuffer = Buffer.from(result.result.document, 'base64');
        await writeFile(outputPath, docBuffer);

        // Add to report
        report.processed.push({
          contract: contractName,
          changes: result.result.changes || [],
          outputPath,
        });

        logger.info({ contract: contractName }, 'Successfully processed and saved document');
      } else {
        report.failed.push({
          contract: result.id.split('-')[0].replace(/\.docx$/, ''),
          error: result.result?.error || 'Unknown error',
        });
        logger.error({ contract: result.id }, 'Failed to process document');
      }
    }

    // Save report
    const reportPath = join(outputDir, 'processing_report.json');
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    logger.info({ reportPath }, 'Saved processing report');

    return report;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage }, 'Failed to process documents');
    throw error;
  }
}

// Run if this is the main module
if (import.meta.path === Bun.main) {
  processDocuments()
    .then((report) => {
      console.log('Processing complete. Report:', JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Processing failed:', error);
      process.exit(1);
    });
}

export { processDocuments };
