import express, { Request, Response } from 'express';
import path from 'path';
import { Readable } from 'node:stream';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const TARGET_FBX_URL = 'https://github.com/ASAPAHMAD/aethelgard-assets/releases/download/v1.0.0/Breathing.Idle.fbx';

async function startServer() {
  const app = express();

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // 1. CORS Preflight for character asset proxy
  app.options('/api/character-asset', (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
  });

  // 2. Diagnostic test endpoint to verify proxy headers and streamability
  app.get('/api/character-asset/diagnostic', async (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
      console.log(`[Diagnostic] Probing upstream master FBX URL: ${TARGET_FBX_URL}`);
      const upstreamRes = await fetch(TARGET_FBX_URL, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Aethelgard-Proxy-Diagnostic/1.0'
        }
      });

      const contentLength = upstreamRes.headers.get('content-length');
      const contentType = upstreamRes.headers.get('content-type');

      if (!upstreamRes.ok || !upstreamRes.body) {
        res.status(502).json({
          success: false,
          upstreamStatus: upstreamRes.status,
          upstreamStatusText: upstreamRes.statusText,
          error: 'Upstream returned non-200 status'
        });
        return;
      }

      // Read only the first chunk to verify binary header without buffering 41.87MB
      const reader = upstreamRes.body.getReader();
      const { value } = await reader.read();
      await reader.cancel();

      let isKaydaraFBX = false;
      let magicHeader = '';
      if (value && value.byteLength >= 23) {
        magicHeader = Buffer.from(value.slice(0, 23)).toString('ascii');
        isKaydaraFBX = magicHeader.startsWith('Kaydara FBX Binary');
      }

      res.json({
        success: true,
        endpoint: '/api/character-asset',
        upstreamUrl: TARGET_FBX_URL,
        finalUpstreamUrl: upstreamRes.url,
        httpStatus: 200,
        contentType: 'application/octet-stream',
        upstreamContentType: contentType,
        contentLength: contentLength || '41871552',
        contentLengthBytes: Number(contentLength) || 41871552,
        contentLengthFormatted: ((Number(contentLength) || 41871552) / (1024 * 1024)).toFixed(2) + ' MiB',
        contentDisposition: 'inline; filename="Breathing.Idle.fbx"',
        isBinaryFBX: isKaydaraFBX,
        magicBytesHeader: magicHeader.trim(),
        firstChunkBytesReceived: value ? value.byteLength : 0,
        corsAllowedOrigin: '*',
        streamingSupported: true
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to probe asset upstream'
      });
    }
  });

  // 3. Primary Same-Origin Streaming Proxy for Master Rigged FBX
  app.get('/api/character-asset', async (req: Request, res: Response) => {
    // SECURITY RESTRICTION: This endpoint ONLY proxies the single hardcoded Aethelgard FBX.
    // It strictly forbids arbitrary user-supplied URLs to prevent open proxy misuse.
    if (req.query.url) {
      res.status(400).json({
        error: 'Arbitrary URL proxying is forbidden. This endpoint only proxies the authoritative master character.'
      });
      return;
    }

    try {
      console.log(`[Proxy] Fetching master FBX server-side: ${TARGET_FBX_URL}`);
      const upstreamAbortController = new AbortController();
      let clientDisconnectedBeforeHeaders = false;
      const onClientCloseBeforeHeaders = () => {
        clientDisconnectedBeforeHeaders = true;
        upstreamAbortController.abort();
      };
      res.once('close', onClientCloseBeforeHeaders);
      const upstreamRes = await fetch(TARGET_FBX_URL, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Aethelgard-Asset-Proxy/1.0',
          'Accept': 'application/octet-stream, application/fbx, */*'
        },
        signal: upstreamAbortController.signal
      });

      console.log(`[Proxy] Upstream status: ${upstreamRes.status} ${upstreamRes.statusText}`);
      console.log(`[Proxy] Upstream content-type: ${upstreamRes.headers.get('content-type')}`);
      console.log(`[Proxy] Upstream content-length: ${upstreamRes.headers.get('content-length')} bytes`);
      res.removeListener('close', onClientCloseBeforeHeaders);

      if (clientDisconnectedBeforeHeaders || !upstreamRes.ok || !upstreamRes.body) {
        console.error(`[Proxy Failure] Upstream returned non-200 status: ${upstreamRes.status}`);
        res.status(502).json({
          error: 'Failed to retrieve master character from upstream GitHub release',
          upstreamStatus: upstreamRes.status,
          upstreamStatusText: upstreamRes.statusText
        });
        return;
      }

      const contentLength = upstreamRes.headers.get('content-length');

      // Set required response headers
      res.status(200);
      res.setHeader('Content-Type', 'application/octet-stream');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
      res.setHeader('Content-Disposition', 'inline; filename="Breathing.Idle.fbx"');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Disposition');

      // Stream the response directly to the client without buffering the 41.9 MiB FBX.
      // IMPORTANT: do not use req.on('close') here. The incoming request can close/finish
      // while the outgoing response is still being streamed. Aborting the stream at that
      // point truncates the FBX and can surface as a production HTTP 500.
      const stream = Readable.fromWeb(upstreamRes.body as any);
      let responseFinished = false;

      const abortUpstreamIfClientDisconnected = () => {
        if (!responseFinished && !res.writableEnded) {
          console.warn('[Proxy] Client disconnected before FBX response completed; aborting upstream fetch.');
          upstreamAbortController.abort();
          stream.destroy();
        }
      };

      res.once('finish', () => {
        responseFinished = true;
      });
      res.once('close', abortUpstreamIfClientDisconnected);

      stream.on('error', (streamErr: any) => {
        // ECONNRESET/AbortError is expected if the browser disconnects.
        const code = streamErr?.code || streamErr?.name;
        if (code === 'ECONNRESET' || code === 'AbortError' || code === 'ABORT_ERR') {
          console.warn('[Proxy Stream Closed]', streamErr?.message || code);
          return;
        }
        console.error('[Proxy Stream Error]', streamErr);
        if (!res.headersSent && !res.writableEnded) {
          res.status(502).json({
            error: 'Upstream character asset stream failed',
            message: streamErr?.message || 'Unknown stream error'
          });
        } else if (!res.writableEnded) {
          res.destroy(streamErr);
        }
      });

      stream.on('end', () => {
        responseFinished = true;
      });

      stream.pipe(res);
    } catch (err: any) {
      // A browser disconnect can abort fetch while the response socket is already closed.
      // Never attempt to write a second response in that case.
      const aborted = err?.name === 'AbortError' || err?.code === 'ABORT_ERR';
      if (aborted || res.destroyed || res.writableEnded) {
        console.warn('[Proxy] Character asset request ended before completion:', err?.message || err);
        return;
      }
      console.error('[Proxy Exception]', err);
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Internal server error while proxying character asset',
          message: err?.message || 'Unknown proxy error'
        });
      }
    }
  });

  // Vite middleware for development vs Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aethelgard Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
