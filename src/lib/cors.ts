import { NextResponse } from 'next/server';

const getAllowedOrigins = () => {
  const raw = process.env.CORS_ALLOWED_ORIGINS || '*';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const isAllowAllEnabled = (allowedOrigins: string[]) => {
  const allowAllFromList = allowedOrigins.includes('*');
  const allowAllFromFlag = process.env.CORS_ALLOW_ALL !== 'false';
  return allowAllFromList || allowAllFromFlag;
};

const resolveOrigin = (req: Request) => {
  const requestOrigin = req.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  const allowAll = isAllowAllEnabled(allowedOrigins);

  if (allowAll) {
    return '*';
  }

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return allowedOrigins[0] || 'null';
};

export const getCorsHeaders = (req: Request): Record<string, string> => {
  const origin = resolveOrigin(req);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  if (origin !== '*') {
    headers.Vary = 'Origin';
  }

  return headers;
};

export const corsOptionsResponse = (req: Request) => {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
};

export const jsonWithCors = (req: Request, body: unknown, init?: ResponseInit) => {
  const response = NextResponse.json(body, init);
  const corsHeaders = getCorsHeaders(req);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
};
