import { ProcessingStatus } from '../types';

const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response('OK');
    }

    // Document upload and processing
    if (url.pathname === '/documents' && req.method === 'POST') {
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

        // TODO: Process document with formatting
        const id = crypto.randomUUID();

        return Response.json(
          {
            id,
            status: 'processing',
          } as ProcessingStatus,
          { status: 202 }
        );
      } catch (error) {
        return Response.json(
          {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 400 }
        );
      }
    }

    // Status check
    if (url.pathname.startsWith('/documents/') && req.method === 'GET') {
      const id = url.pathname.split('/')[2];
      // TODO: Get actual status
      return Response.json({
        id,
        status: 'processing',
      } as ProcessingStatus);
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Server listening on http://localhost:${server.port}`);
