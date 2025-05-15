import { ShortLinkController } from '@/lib/controllers/shortLinkController';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

/**
 * Server component page for handling short code redirection in App Router.
 * Fetches the original URL and redirects, or shows a 404 page if not found.
 * @param props - The component props.
 * @param props.params - The route parameters.
 * @param props.params.shortCode - The short code from the URL.
 * @returns JSX.Element | null - Renders nothing as it redirects, or triggers a 404.
 */
export default async function ShortCodePage({ params }: { params: { shortCode: string } }) {
  const controller = new ShortLinkController();
  await controller.init();

  const { shortCode } = await params;

  if (!shortCode || typeof shortCode !== 'string') {
    console.warn('ShortCodePage: shortCode is invalid or missing', shortCode);
    notFound();
  }

  try {

    console.log(shortCode)
    const originalUrl = await controller.redirectShortLink(shortCode);

    if (originalUrl) {
      redirect(originalUrl);
    } else {
      console.warn(`ShortCodePage: No original URL found for shortCode: ${shortCode}`);
      notFound();
    }
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error(`ShortCodePage: Error during redirection for shortCode ${shortCode}:`, error);
    notFound();
  }

  // This part should ideally not be reached due to redirect() or notFound()
  return null;
} 