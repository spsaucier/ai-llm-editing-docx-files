import { ProcessingStatus } from '../types';
import { Processor } from '../processor';
import { mkdir } from 'fs/promises';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

// Initialize processor and ensure temp directory exists
const processor = new Processor();
await mkdir(processor.tempDir, { recursive: true });

// In-memory status tracking (replace with database in production)
const processingStatus = new Map<string, ProcessingStatus>();

const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(req) {
    const startTime = Date.now();
    const url = new URL(req.url);
    const method = req.method;

    logger.info({ path: url.pathname, method }, 'Incoming request');
    metrics.increment('http_requests_total', { path: url.pathname, method });

    try {
      // Health check
      if (url.pathname === '/health') {
        return new Response('OK');
      }

      // Metrics endpoint
      if (url.pathname === '/metrics') {
        logger.info('Metrics requested');
        return Response.json(metrics.getMetrics());
      }

      // Document upload and processing
      if (url.pathname === '/documents' && method === 'POST') {
        try {
          const formData = await req.formData();
          const document = formData.get('document');
          if (!(document instanceof File)) {
            throw new Error('Document must be a file');
          }

          const clause = formData.get('clause');
          if (typeof clause !== 'string') {
            throw new Error('Clause must be a string');
          }

          const targetSection = formData.get('targetSection');
          if (typeof targetSection !== 'string') {
            throw new Error('Target section must be a string');
          }

          const formattingStr = formData.get('formatting');
          const formatting = formattingStr
            ? JSON.parse(typeof formattingStr === 'string' ? formattingStr : '{}')
            : { bold: false, underline: false };

          // Process document
          const id = crypto.randomUUID();
          const arrayBuffer = await document.arrayBuffer();
          const base64Doc = Buffer.from(arrayBuffer).toString('base64');

          logger.info({ id }, 'Starting document processing');
          metrics.increment('documents_processing_total');

          // Initialize status
          const status: ProcessingStatus = {
            id,
            status: 'processing',
          };
          processingStatus.set(id, status);

          // Start processing in background
          processor
            .process({
              id,
              document: base64Doc,
              clause,
              targetSection,
              formatting,
            })
            .then((processedDoc) => {
              processingStatus.set(id, {
                id,
                status: 'completed',
                result: {
                  document: processedDoc,
                },
              });
              logger.info({ id }, 'Document processed successfully');
              metrics.increment('documents_processed_total', { status: 'success' });
            })
            .catch((error) => {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              processingStatus.set(id, {
                id,
                status: 'failed',
                result: {
                  error: errorMessage,
                },
              });
              logger.error({ id, error: errorMessage }, 'Error processing document');
              metrics.increment('documents_processed_total', { status: 'error' });
            });

          return Response.json(status, { status: 202 });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error({ error: errorMessage }, 'Error handling request');
          metrics.increment('http_errors_total', { type: 'request_error' });
          return Response.json(
            {
              error: errorMessage,
            },
            { status: 400 }
          );
        }
      }

      // Status check
      if (url.pathname.startsWith('/documents/') && method === 'GET') {
        const id = url.pathname.split('/')[2];
        const status = processingStatus.get(id);

        if (!status) {
          logger.warn({ id }, 'Document not found');
          metrics.increment('http_errors_total', { type: 'not_found' });
          return Response.json(
            {
              error: 'Document not found',
            },
            { status: 404 }
          );
        }

        logger.info({ id, status: status.status }, 'Retrieved document status');
        return Response.json(status);
      }

      // Not found
      logger.warn({ path: url.pathname }, 'Route not found');
      metrics.increment('http_errors_total', { type: 'not_found' });
      return new Response('Not Found', { status: 404 });
    } finally {
      // Record request duration
      const duration = Date.now() - startTime;
      metrics.histogram('http_request_duration_ms', duration, {
        path: url.pathname,
        method,
      });
    }
  },
});

logger.info({ port: server.port }, `Server listening on http://localhost:${server.port}`);
