declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeCheckoutOptions {
    paymentSessionId?: string;
    orderId?: string;
    redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | HTMLElement;
  }

  export interface CashfreeCheckoutResult {
    redirectUrl?: string;
    redirect?: boolean;
    error?: {
      message?: string;
      code?: string;
      type?: string;
    };
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
