"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  getClinicPaymentConfig,
  updateClinicPaymentConfig,
  verifyClinicPaymentProvider,
  type ClinicPaymentConfig,
  type PaymentProvider,
  type PaymentProviderCredentials,
} from '@/lib/actions/payment-config.server';
import { showErrorToast, showSuccessToast } from '@/hooks/utils/use-toast';
// This is the config page itself, so the admin must see every provider the
// app supports (to configure one that isn't enabled yet) — not the subset
// already enabled for some clinic, which is what "ENABLED_" would imply.
import { SUPPORTED_PAYMENT_PROVIDERS } from '@/lib/payments/providers';

type Props = { clinicId: string; currency: string };
type ProviderCredentials = Record<PaymentProvider, PaymentProviderCredentials>;

const EMPTY_CREDENTIALS: ProviderCredentials = {
  cashfree: {},
  razorpay: {},
  phonepe: {},
  zoho: {},
  easebuzz: {},
  paytm: {},
  payu: {},
};

const providerFields: Record<PaymentProvider, { key: string; label: string; secret?: boolean }[]> = {
  cashfree: [
    { key: 'cashfreeAppId', label: 'App ID' },
    { key: 'cashfreeSecretKey', label: 'Secret key', secret: true },
  ],
  razorpay: [
    { key: 'keyId', label: 'Key ID' },
    { key: 'keySecret', label: 'Key secret', secret: true },
    { key: 'webhookSecret', label: 'Webhook secret', secret: true },
  ],
  phonepe: [
    { key: 'phonepeClientId', label: 'Client ID' },
    { key: 'phonepeClientSecret', label: 'Client secret', secret: true },
    { key: 'phonepeSalt', label: 'Salt / webhook password', secret: true },
  ],
  zoho: [
    { key: 'accountId', label: 'Account ID' },
    { key: 'accessToken', label: 'Access token', secret: true },
    { key: 'signingKey', label: 'Signing key', secret: true },
  ],
  easebuzz: [
    { key: 'merchantKey', label: 'Merchant key', secret: true },
    { key: 'merchantSalt', label: 'Merchant salt', secret: true },
  ],
  paytm: [
    { key: 'merchantId', label: 'Merchant ID' },
    { key: 'merchantKey', label: 'Merchant key', secret: true },
    { key: 'website', label: 'Website' },
    { key: 'industryType', label: 'Industry type' },
  ],
  payu: [
    { key: 'merchantKey', label: 'Merchant key' },
    { key: 'merchantSalt', label: 'Merchant salt', secret: true },
    { key: 'clientId', label: 'Client ID' },
    { key: 'clientSecret', label: 'Client secret', secret: true },
  ],
};

const providerLabels: Record<PaymentProvider, string> = {
  cashfree: 'Cashfree',
  razorpay: 'Razorpay',
  phonepe: 'PhonePe',
  zoho: 'Zoho',
  easebuzz: 'Easebuzz',
  paytm: 'Paytm',
  payu: 'PayU',
};

export function PaymentProviderSettings({ clinicId, currency }: Props) {
  const [config, setConfig] = useState<ClinicPaymentConfig | null>(null);
  const [provider, setProvider] = useState<PaymentProvider>('cashfree');
  const [enabled, setEnabled] = useState(true);
  const [environment, setEnvironment] = useState('sandbox');
  const [credentials, setCredentials] = useState<ProviderCredentials>(EMPTY_CREDENTIALS);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<{ valid: boolean; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getClinicPaymentConfig(clinicId)
      .then((nextConfig) => {
        if (!active || !nextConfig) return;
        const nextProvider = (nextConfig.primary?.provider || SUPPORTED_PAYMENT_PROVIDERS[0] || 'cashfree') as PaymentProvider;
        setConfig(nextConfig);
        setProvider(nextProvider);
        setEnabled(nextConfig.primary?.enabled ?? true);
      })
      .catch((error) => {
        if (active) showErrorToast(error instanceof Error ? error.message : 'Unable to load payment configuration.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [clinicId]);

  const configured = config?.primary?.provider === provider && config.primary.hasCredentials;
  const setCredential = (key: string, value: string) => {
    setCredentials((current) => ({ ...current, [provider]: { ...current[provider], [key]: value } }));
    setVerification(null);
  };

  const verify = async () => {
    setVerifying(true);
    setVerification(null);
    try {
      const result = await verifyClinicPaymentProvider(provider, { ...credentials[provider], environment });
      setVerification({ valid: result.valid, message: result.valid ? result.details || 'Credentials look valid.' : result.error || 'Credentials are incomplete.' });
      if (result.valid) showSuccessToast(`${providerLabels[provider]} credential format validated.`);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Unable to verify credentials.');
    } finally {
      setVerifying(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const nextConfig = await updateClinicPaymentConfig(clinicId, {
        primary: { provider, enabled, credentials: { ...credentials[provider], environment }, priority: 1 },
        defaultCurrency: currency || 'INR',
        defaultProvider: provider,
      });
      setConfig(nextConfig);
      setCredentials(EMPTY_CREDENTIALS);
      setVerification(null);
      showSuccessToast(`${providerLabels[provider]} is now the clinic payment provider.`);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Unable to save payment configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-teal-200 bg-teal-50/70 shadow-sm dark:border-teal-900/70 dark:bg-teal-950/20">
      <CardHeader className="gap-2 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Payment Provider</CardTitle>
            <CardDescription>Choose the gateway used by the bridge and mobile checkout.</CardDescription>
          </div>
          <KeyRound className="size-5 text-teal-700 dark:text-teal-300" />
        </div>
        {config?.primary ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {configured ? <CheckCircle2 className="size-4 text-emerald-600" /> : <CircleAlert className="size-4 text-amber-600" />}
            {configured ? `${providerLabels[provider]} credentials are configured.` : 'Credentials are not configured yet.'}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4 sm:px-5">
        {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading gateway configuration…</div> : (
          <>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <div className="grid gap-2">
                <Label htmlFor="payment-provider">Active provider</Label>
                <select id="payment-provider" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={provider} onChange={(event) => { setProvider(event.target.value as PaymentProvider); setVerification(null); }}>
                  {SUPPORTED_PAYMENT_PROVIDERS.map((p) => (
                    <option key={p} value={p}>{providerLabels[p] || p}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2"><Label htmlFor="payment-environment">Environment</Label><select id="payment-environment" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={environment} onChange={(event) => setEnvironment(event.target.value)}><option value="sandbox">Sandbox</option><option value="production">Production</option></select></div>
              <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3"><Label htmlFor="payment-enabled">Enabled</Label><Switch id="payment-enabled" checked={enabled} onCheckedChange={setEnabled} /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {providerFields[provider].map((field) => {
                const inputId = `payment-${provider}-${field.key}`;
                const isVisible = visible[inputId];
                return <div className="grid gap-2" key={field.key}><Label htmlFor={inputId}>{field.label}</Label><div className="relative"><Input id={inputId} className="h-10 pr-10" type={field.secret && !isVisible ? 'password' : 'text'} value={credentials[provider][field.key] || ''} onChange={(event) => setCredential(field.key, event.target.value)} placeholder={configured ? 'Leave blank to keep saved value' : undefined} autoComplete="new-password" />{field.secret ? <button type="button" className="absolute inset-y-0 right-0 px-3 text-muted-foreground" onClick={() => setVisible((current) => ({ ...current, [inputId]: !isVisible }))} aria-label={isVisible ? `Hide ${field.label}` : `Show ${field.label}`}>{isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button> : null}</div></div>;
              })}
            </div>
            <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-700" />Secrets are never returned to this screen. Leave a field blank to retain the encrypted value already stored by the backend.</p>
            {verification ? <div className={`rounded-md border px-3 py-2 text-sm ${verification.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{verification.message}</div> : null}
            <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={verify} disabled={verifying || saving}>{verifying ? <Loader2 className="size-4 animate-spin" /> : null}Validate credential format</Button><Button type="button" onClick={save} disabled={saving || verifying}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Save provider</Button></div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
