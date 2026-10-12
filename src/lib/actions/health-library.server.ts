'use server';

import { authenticatedApi } from './auth.server';
import {
  actionFailure,
  actionSuccess,
  caughtFailure,
  clinicHeaders,
  resolveClinicContext,
  statusFailure,
  type ActionErrorCode,
  type ActionFailure,
} from './_shared';
import { API_ENDPOINTS } from '../config/config';

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

export type HealthLibraryErrorCode = ActionErrorCode;

type HealthLibraryFailure = ActionFailure;

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
    query ? `${API_ENDPOINTS.HEALTH_LIBRARY.BASE}?${query}` : API_ENDPOINTS.HEALTH_LIBRARY.BASE,
    {
      headers: clinicHeaders(clinicId),
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
  return actionSuccess({ items, total });
}

/** Lists health library posts for the signed-in user's clinic. */
export async function fetchHealthLibraryPosts(
  filters: HealthLibraryListFilters = {}
): Promise<HealthLibraryListResult> {
  try {
    const context = await resolveClinicContext('load the health library');
    if (!context.success) {
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
    const context = await resolveClinicContext('load the health library');
    if (!context.success) {
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
      return actionFailure('A library item id is required', 'NOT_FOUND');
    }

    const context = await resolveClinicContext('load the health library');
    if (!context.success) {
      return context;
    }

    const { status, data } = await authenticatedApi<HealthLibraryPost>(
      API_ENDPOINTS.HEALTH_LIBRARY.GET_BY_ID(postId),
      {
        headers: clinicHeaders(context.clinicId),
        omitClinicId: true,
        cache: 'no-store',
      }
    );

    const failure = statusFailure(status, 'Library item');
    if (failure) {
      return failure;
    }
    if (!data || typeof data !== 'object' || !data.id) {
      return actionFailure('Library item was not found', 'NOT_FOUND');
    }

    return actionSuccess(data);
  } catch (error) {
    return caughtFailure(error);
  }
}
