'use server';

import { getServerSession } from './auth.server';

export async function getFrontendSystemMetrics() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const os = await import('os');
  return {
    uptime: os.uptime(),
    platform: os.platform(),
    loadAvg: os.loadavg(),
  };
}
