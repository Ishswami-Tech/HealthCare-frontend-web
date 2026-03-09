declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeCheckoutOptions {
    paymentSessionId?: string;
    orderId?: string;
  }

  export interface CashfreeCheckoutResult {
    redirectUrl?: string;
  }

  export interface CashfreeInstance {
    checkout: (
      options: CashfreeCheckoutOptions
    ) => Promise<CashfreeCheckoutResult>;
  }

  export function load(options: {
    mode: "sandbox" | "production";
  }): Promise<CashfreeInstance | null>;
}

