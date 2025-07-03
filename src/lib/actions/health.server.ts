'use server';

// Health check server action
export async function getHealthStatus(): Promise<{ status: string; details?: unknown }> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088';
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return { status: 'unhealthy', details: error instanceof Error ? error.message : String(error) };
  }
} 