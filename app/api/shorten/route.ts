import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ShortLinkController, ShortLink } from '@/lib/controllers/shortLinkController';

const controller = new ShortLinkController();

/**
 * API Route Handler for creating short links using Next.js App Router.
 * Accepts POST requests with an `originalUrl` in the JSON body.
 * @param req - The NextRequest object.
 * @returns A NextResponse object with the short link data or an error message.
 */
export async function POST(req: NextRequest) {
  try {
    await controller.init(); // Ensure controller is initialized

    const body = await req.json();
    const { originalUrl } = body;

    if (!originalUrl || typeof originalUrl !== 'string') {
      return NextResponse.json({ error: 'Original URL is required and must be a string.' }, { status: 400 });
    }

    const shortLink = await controller.createShortLink(originalUrl);

    if (shortLink) {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const fullShortUrl = `${protocol}://${host}/${shortLink.shortCode}`;
      
      return NextResponse.json({ ...shortLink, shortUrl: fullShortUrl }, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Failed to create short link. Controller or database issue.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/shorten:", error);
    if (error.message === 'Invalid URL format') {
      return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 });
    }
    if (error instanceof SyntaxError) { // Handle cases where req.json() fails
        return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error while creating short link.' }, { status: 500 });
  }
} 