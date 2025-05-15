import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ShortLinkController } from '@/lib/controllers/shortLinkController';

const controller = new ShortLinkController();

/**
 * API Route Handler for fetching statistics for a short link using Next.js App Router.
 * Uses a dynamic segment `[shortCode]` for the short code.
 * @param req - The NextRequest object.
 * @param context - Contains route parameters, including `shortCode`.
 * @param context.params - The route parameters.
 * @param context.params.shortCode - The short code to retrieve statistics for.
 * @returns A NextResponse object with the short link statistics or an error message.
 */
export async function GET(
  req: NextRequest, 
  { params }: { params: { shortCode: string } }
) {
  try {
    await controller.init(); // Ensure controller is initialized
    const { shortCode } = await params;

    if (!shortCode || typeof shortCode !== 'string') {
      return NextResponse.json({ error: 'Short code is required.' }, { status: 400 });
    }

    const stats = await controller.getLinkStats(shortCode);

    if (stats) {
      return NextResponse.json(stats, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Short link not found or no stats available.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`Error in GET /api/stats/${params.shortCode}:`, error);
    return NextResponse.json({ error: 'Internal server error while fetching stats.' }, { status: 500 });
  }
} 