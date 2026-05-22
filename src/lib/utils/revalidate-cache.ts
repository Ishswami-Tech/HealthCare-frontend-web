import { revalidateTag } from 'next/cache';

import { logger } from '@/lib/utils/logger';

export async function revalidateCache(tag: string) {
  try {
    (revalidateTag as any)(tag, 'max');
  } catch (error: unknown) {
    logger.warn(`Failed to revalidate tag: ${tag}`, { error });
  }
}
