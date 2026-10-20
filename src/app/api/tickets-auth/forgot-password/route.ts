import { NextRequest } from 'next/server';
import { forwardPublicAdminAuth } from '@/tickets-portal/auth/public-auth-proxy';
export async function POST(req: NextRequest) { return forwardPublicAdminAuth(req, 'forgot-password'); }
