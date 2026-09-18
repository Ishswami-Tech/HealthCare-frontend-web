import { authenticatedApi } from './auth.server';

export type PaymentProvider = 'cashfree' | 'razorpay' | 'phonepe' | 'zoho' | 'easebuzz' | 'paytm' | 'payu';

export type PaymentProviderStatus = {
  provider: string;
  enabled: boolean;
  priority?: number;
  hasCredentials: boolean;
  providerName: string;
};

export type ClinicPaymentConfig = {
  clinicId: string;
  primary: PaymentProviderStatus;
  fallback?: PaymentProviderStatus[];
  defaultCurrency?: string;
  defaultProvider?: string;
};

export type PaymentProviderCredentials = Record<string, string>;

export type PaymentProviderConfigInput = {
  provider: PaymentProvider;
  enabled: boolean;
  credentials: PaymentProviderCredentials;
  priority?: number;
};

export type UpdateClinicPaymentConfigInput = {
  primary: PaymentProviderConfigInput;
  fallback?: PaymentProviderConfigInput[];
  defaultCurrency?: string;
  defaultProvider?: PaymentProvider;
};

export async function getClinicPaymentConfig(clinicId: string) {
  const { data } = await authenticatedApi<ClinicPaymentConfig>(`/payments/config/${encodeURIComponent(clinicId)}`, {
    method: 'GET',
    clinicId,
    requireClinicId: true,
  });
  return data;
}

export async function updateClinicPaymentConfig(clinicId: string, config: UpdateClinicPaymentConfigInput) {
  const { data } = await authenticatedApi<ClinicPaymentConfig>(`/payments/config/${encodeURIComponent(clinicId)}`, {
    method: 'PUT',
    clinicId,
    requireClinicId: true,
    body: JSON.stringify(config),
  });
  return data;
}

export async function verifyClinicPaymentProvider(
  provider: PaymentProvider,
  credentials: PaymentProviderCredentials
) {
  const { data } = await authenticatedApi<{ valid: boolean; error?: string; details?: string }>(
    '/payments/config/verify',
    {
      method: 'POST',
      body: JSON.stringify({ provider, credentials }),
    }
  );
  return data;
}
