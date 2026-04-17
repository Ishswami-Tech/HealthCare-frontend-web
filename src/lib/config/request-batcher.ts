// ✅ Request Batching for 10M+ Users
// Batches multiple API requests to reduce server load

interface BatchedRequest {
  id: string;
  endpoint: string;
  options: RequestInit;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class RequestBatcher {
  private batchQueue: Map<string, BatchedRequest[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly MAX_BATCH_SIZE = 50;
  private readonly BATCH_DELAY = 100; // ms
  // MAX_WAIT_TIME removed - using BATCH_DELAY instead

  /**
   * Add request to batch queue
   */
  async batchRequest<T>(
    endpoint: string,
    options: RequestInit,
    executeRequest: (endpoint: string, options: RequestInit) => Promise<T>
  ): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const batchKey = `${method}:${endpoint}`;

    // For non-GET requests, execute immediately (no batching)
    if (method !== 'GET') {
      return executeRequest(endpoint, options);
    }

    return new Promise<T>((resolve, reject) => {
      const request: BatchedRequest = {
        id: `${Date.now()}-${Math.random()}`,
        endpoint,
        options,
        resolve: resolve as (value: any) => void,
        reject,
      };

      // Get or create batch queue for this endpoint
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, []);
      }
      const queue = this.batchQueue.get(batchKey)!;
      queue.push(request);

      // Process batch if it reaches max size
      if (queue.length >= this.MAX_BATCH_SIZE) {
        this.processBatch(batchKey, executeRequest);
        return;
      }

      // Set timer to process batch after delay
      if (!this.batchTimers.has(batchKey)) {
        const timer = setTimeout(() => {
          this.processBatch(batchKey, executeRequest);
        }, this.BATCH_DELAY);
        this.batchTimers.set(batchKey, timer);
      }
    });
  }

  /**
   * Process a batch of requests
   */
  private async processBatch<T>(
    batchKey: string,
    executeRequest: (endpoint: string, options: RequestInit) => Promise<T>
  ): Promise<void> {
    const queue = this.batchQueue.get(batchKey);
    if (!queue || queue.length === 0) return;

    // Clear timer
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }

    // Remove requests from queue
    this.batchQueue.delete(batchKey);

    // Execute all requests in parallel
    const promises = queue.map(request =>
      executeRequest(request.endpoint, request.options)
        .then(result => ({ request, result, error: null }))
        .catch(error => ({ request, result: null, error }))
    );

    const results = await Promise.all(promises);

    // Resolve or reject each request
    results.forEach(({ request, result, error }) => {
      if (error) {
        request.reject(error);
      } else {
        request.resolve(result);
      }
    });
  }

  /**
   * Clear all pending batches
   */
  clear(): void {
    this.batchQueue.clear();
    this.batchTimers.forEach(timer => clearTimeout(timer));
    this.batchTimers.clear();
  }
}

// Singleton instance
export const requestBatcher = new RequestBatcher();
