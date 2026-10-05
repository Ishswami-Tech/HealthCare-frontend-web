'use server';

import { authenticatedApi, getServerSession } from './auth.server';

/**
 * Health Library — wellness articles and videos written by the clinic.
 *
 * Backend routes (`HealthLibraryController`):
 *   GET health-library        list (patients only ever receive PUBLISHED posts)
 *   GET health-library/:id    one post (the backend counts a view)
 *
 * The actions mirror `fetchPatientDashboardSummary`: they resolve the clinic from the
 * session, send it as `X-Clinic-ID`, and return a discriminated result instead of throwing.
 */

const HEALTH_LIBRARY_ENDPOINT = '/health-library';

export type HealthLibraryTab = 'ARTICLES' | 'GUIDES' | 'PRACTICES' | 'COURSES';
export type HealthLibraryMediaType = 'ARTICLE' | 'VIDEO';
export type HealthLibraryStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface HealthLibrarySection {
  heading: string;
  body: string;
}

/** Mirrors the backend `HealthLibraryPostResponse`. */
export interface HealthLibraryPost {
  id: string;
  clinicId: string;
  tab: HealthLibraryTab;
  mediaType: HealthLibraryMediaType;
  status: HealthLibraryStatus;
  title: string;
  category: string;
  readTime: string | null;
  summary: string;
  coverImageUrl: string | null;
  videoUrl: string | null;
  videoDurationSeconds: number | null;
  sections: HealthLibrarySection[];
  whenToSeeDoctor: string | null;
  viewCount: number;
  publishedAt: string | null;
  authorId: string;
  authorName: string | null;
  authorRole: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors the backend `HealthLibraryListResponse`. */
export interface HealthLibraryList {
  items: HealthLibraryPost[];
  total: number;
}

/** Query params accepted by `GET health-library` (`ListHealthLibraryQueryDto`). */
export interface HealthLibraryListFilters {
  /** Library shelf: ARTICLES, GUIDES, PRACTICES or COURSES. */
  tab?: HealthLibraryTab;
  /** ARTICLE or VIDEO. */
  mediaType?: HealthLibraryMediaType;
  /** Exact category name, for example "Heart Health". */
  category?: string;
  search?: string;
  /** 1–100. The backend default is 20. */
  limit?: number;
  offset?: number;
}

/** One call's worth of data for the library home page (`fetchHealthLibraryOverview`). */
export interface HealthLibraryOverview {
  /** The newest posts of every shelf (up to 100): featured item, topics and "most read". */
  latest: HealthLibraryList;
  /** The newest posts of each shelf, with that shelf's total. */
  articles: HealthLibraryList;
  videos: HealthLibraryList;
  guides: HealthLibraryList;
  practices: HealthLibraryList;
  courses: HealthLibraryList;
}

export type HealthLibraryErrorCode =
  | 'UNAUTHENTICATED'
  | 'CLINIC_CONTEXT_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'NETWORK'
  | 'UNKNOWN';

type HealthLibraryFailure = { success: false; error: string; code?: HealthLibraryErrorCode };

type ClinicContext = { clinicId: string } | HealthLibraryFailure;

async function resolveClinicContext(): Promise<ClinicContext> {
  const session = await getServerSession();
  const sessionUser = session?.user as
    | { clinicId?: string; primaryClinicId?: string; id?: string; sub?: string }
    | undefined;

  const userId = sessionUser?.id || sessionUser?.sub;
  if (!userId) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };
  }

  const clinicId = sessionUser?.clinicId || sessionUser?.primaryClinicId;
  if (!clinicId) {
    return {
      success: false,
      error: 'Clinic context is required to load the health library',
      code: 'CLINIC_CONTEXT_REQUIRED',
    };
  }

  return { clinicId };
}

function statusFailure(status: number, what: string): HealthLibraryFailure | null {
  if (status === 401) {
    return { success: false, error: 'Session expired. Please sign in again.', code: 'UNAUTHENTICATED' };
  }
  if (status === 403) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }
  if (status === 404) {
    return { success: false, error: `${what} was not found`, code: 'NOT_FOUND' };
  }
  if (status >= 400) {
    return { success: false, error: `${what} request failed with status ${status}`, code: 'NETWORK' };
  }
  return null;
}

function caughtFailure(error: unknown): HealthLibraryFailure {
  const statusCode =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : NaN;
  const message = error instanceof Error ? error.message : 'Unknown error';
  if (statusCode === 404) {
    return { success: false, error: message, code: 'NOT_FOUND' };
  }
  if (statusCode === 401) {
    return { success: false, error: message, code: 'UNAUTHENTICATED' };
  }
  if (statusCode === 403) {
    return { success: false, error: message, code: 'FORBIDDEN' };
  }
  return { success: false, error: message, code: 'NETWORK' };
}

type HealthLibraryListResult = { success: true; data: HealthLibraryList } | HealthLibraryFailure;

/** `GET health-library` for one clinic. Throws only what `authenticatedApi` throws. */
async function listHealthLibraryPosts(
  clinicId: string,
  filters: HealthLibraryListFilters
): Promise<HealthLibraryListResult> {
  const params = new URLSearchParams();
  if (filters.tab) params.set('tab', filters.tab);
  if (filters.mediaType) params.set('mediaType', filters.mediaType);
  if (filters.category?.trim()) params.set('category', filters.category.trim());
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (typeof filters.limit === 'number' && Number.isFinite(filters.limit)) {
    params.set('limit', String(Math.min(100, Math.max(1, Math.floor(filters.limit)))));
  }
  if (typeof filters.offset === 'number' && Number.isFinite(filters.offset) && filters.offset > 0) {
    params.set('offset', String(Math.floor(filters.offset)));
  }
  const query = params.toString();

  const { status, data } = await authenticatedApi<HealthLibraryList>(
    query ? `${HEALTH_LIBRARY_ENDPOINT}?${query}` : HEALTH_LIBRARY_ENDPOINT,
    {
      headers: { 'X-Clinic-ID': clinicId },
      omitClinicId: true,
      cache: 'no-store',
    }
  );

  const failure = statusFailure(status, 'Health library');
  if (failure) {
    return failure;
  }

  // Backend returns the DTO directly: { items, total }.
  const items = Array.isArray(data?.items) ? data.items : [];
  const total = typeof data?.total === 'number' ? data.total : items.length;
  return { success: true, data: { items, total } };
}

/** Lists health library posts for the signed-in user's clinic. */
export async function fetchHealthLibraryPosts(
  filters: HealthLibraryListFilters = {}
): Promise<HealthLibraryListResult> {
  try {
    const context = await resolveClinicContext();
    if (!('clinicId' in context)) {
      return context;
    }
    return await listHealthLibraryPosts(context.clinicId, filters);
  } catch (error) {
    return caughtFailure(error);
  }
}

const OVERVIEW_LATEST_LIMIT = 100;
const OVERVIEW_SHELF_LIMIT = 3;

/**
 * Everything the library home page needs, in one round trip: the newest posts plus the first
 * cards and the total of each shelf. Calls `GET health-library` six times in parallel
 * (no filter, `tab=ARTICLES`, `mediaType=VIDEO`, `tab=GUIDES`, `tab=PRACTICES`, `tab=COURSES`).
 */
export async function fetchHealthLibraryOverview(): Promise<
  { success: true; data: HealthLibraryOverview } | HealthLibraryFailure
> {
  try {
    const context = await resolveClinicContext();
    if (!('clinicId' in context)) {
      return context;
    }
    const { clinicId } = context;
    const shelf = { limit: OVERVIEW_SHELF_LIMIT };

    const [latest, articles, videos, guides, practices, courses] = await Promise.all([
      listHealthLibraryPosts(clinicId, { limit: OVERVIEW_LATEST_LIMIT }),
      listHealthLibraryPosts(clinicId, { ...shelf, tab: 'ARTICLES' }),
      listHealthLibraryPosts(clinicId, { ...shelf, mediaType: 'VIDEO' }),
      listHealthLibraryPosts(clinicId, { ...shelf, tab: 'GUIDES' }),
      listHealthLibraryPosts(clinicId, { ...shelf, tab: 'PRACTICES' }),
      listHealthLibraryPosts(clinicId, { ...shelf, tab: 'COURSES' }),
    ]);

    if (!latest.success) return latest;
    if (!articles.success) return articles;
    if (!videos.success) return videos;
    if (!guides.success) return guides;
    if (!practices.success) return practices;
    if (!courses.success) return courses;

    return {
      success: true,
      data: {
        latest: latest.data,
        articles: articles.data,
        videos: videos.data,
        guides: guides.data,
        practices: practices.data,
        courses: courses.data,
      },
    };
  } catch (error) {
    return caughtFailure(error);
  }
}

/** Loads one health library post. The backend records a view for it. */
export async function fetchHealthLibraryPost(
  id: string
): Promise<{ success: true; data: HealthLibraryPost } | HealthLibraryFailure> {
  try {
    const postId = String(id || '').trim();
    if (!postId) {
      return { success: false, error: 'A library item id is required', code: 'NOT_FOUND' };
    }

    const context = await resolveClinicContext();
    if (!('clinicId' in context)) {
      return context;
    }

    const { status, data } = await authenticatedApi<HealthLibraryPost>(
      `${HEALTH_LIBRARY_ENDPOINT}/${encodeURIComponent(postId)}`,
      {
        headers: { 'X-Clinic-ID': context.clinicId },
        omitClinicId: true,
        cache: 'no-store',
      }
    );

    const failure = statusFailure(status, 'Library item');
    if (failure) {
      return failure;
    }
    if (!data || typeof data !== 'object' || !data.id) {
      return { success: false, error: 'Library item was not found', code: 'NOT_FOUND' };
    }

    return { success: true, data };
  } catch (error) {
    return caughtFailure(error);
  }
}
