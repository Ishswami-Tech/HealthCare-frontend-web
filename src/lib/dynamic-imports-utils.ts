import React, { type ComponentType } from 'react';
import dynamic from 'next/dynamic';

interface DynamicImportOptions {
  loading?: ComponentType;
  ssr?: boolean;
}

export function createDynamicComponent<T = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: DynamicImportOptions = {}
) {
  const { loading, ssr = false } = options;

  return dynamic(importFn, {
    ...(loading ? { loading: () => React.createElement(loading) } : {}),
    ssr,
  });
}

export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<Record<string, unknown>> }>
) {
  if (typeof window !== 'undefined') {
    const preload = () => {
      importFn().catch(console.error);
    };

    document.addEventListener('mouseover', preload, { once: true });
    document.addEventListener('touchstart', preload, { once: true, passive: true });
    setTimeout(preload, 2000);
  }
}

export function preloadComponents(
  importFns: Array<
    () => Promise<{ default: ComponentType<Record<string, unknown>> }>
  >
) {
  importFns.forEach(preloadComponent);
}

export function preloadRouteComponents(pathname: string) {
  switch (pathname) {
    case '/':
      preloadComponents([
        () => import('@/components/home/HomeTreatments'),
        () => import('@/components/home/HomeHealthAssessment'),
        () => import('@/components/home/HomeTestimonials'),
      ]);
      break;
    case '/treatments':
      preloadComponents([
        () => import('@/components/home/HomeTreatments'),
        () => import('@/components/home/HomeTrust'),
      ]);
      break;
    case '/contact':
      break;
  }
}
