import { useMutationOperation } from '../core/useMutationOperation';
import { useQueryData } from '../core/useQueryData';
import { TOAST_IDS } from '../utils/use-toast';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import type {
  EnableReviewLoginInput,
  ReviewLoginIssued,
  ReviewLoginStatus,
} from '@/types/review-login.types';

const REVIEW_LOGIN_QUERY_KEY = ['auth', 'admin', 'review-login'];

export const useReviewLoginStatus = () => {
  return useQueryData<ReviewLoginStatus>(REVIEW_LOGIN_QUERY_KEY, async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.AUTH.REVIEW_LOGIN);
    return (result.data ?? result) as ReviewLoginStatus;
  });
};

export const useEnableReviewLogin = () => {
  return useMutationOperation<ReviewLoginIssued, EnableReviewLoginInput>(
    async (input) => {
      const result = await clinicApiClient.put(API_ENDPOINTS.AUTH.REVIEW_LOGIN, input);
      return (result.data ?? result) as ReviewLoginIssued;
    },
    {
      toastId: TOAST_IDS.REVIEW_LOGIN.SAVE,
      loadingMessage: 'Turning on review login...',
      successMessage: 'Review login is on. Copy the code now.',
      invalidateQueries: [REVIEW_LOGIN_QUERY_KEY],
    }
  );
};

export const useRegenerateReviewLogin = () => {
  return useMutationOperation<ReviewLoginIssued, void>(
    async () => {
      const result = await clinicApiClient.post(API_ENDPOINTS.AUTH.REVIEW_LOGIN_REGENERATE);
      return (result.data ?? result) as ReviewLoginIssued;
    },
    {
      toastId: TOAST_IDS.REVIEW_LOGIN.SAVE,
      loadingMessage: 'Generating a new code...',
      successMessage: 'New code generated. The old code no longer works.',
      invalidateQueries: [REVIEW_LOGIN_QUERY_KEY],
    }
  );
};

export const useDisableReviewLogin = () => {
  return useMutationOperation<ReviewLoginStatus, void>(
    async () => {
      const result = await clinicApiClient.delete(API_ENDPOINTS.AUTH.REVIEW_LOGIN);
      return (result.data ?? result) as ReviewLoginStatus;
    },
    {
      toastId: TOAST_IDS.REVIEW_LOGIN.SAVE,
      loadingMessage: 'Turning off review login...',
      successMessage: 'Review login is off.',
      invalidateQueries: [REVIEW_LOGIN_QUERY_KEY],
    }
  );
};
