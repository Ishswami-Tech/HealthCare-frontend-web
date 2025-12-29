"use client";

import React from 'react';
import { GlobalHealthStatusButton } from './GlobalHealthStatusButton';

/**
 * Global Health Status Provider
 * Adds a floating health status button to all pages
 */
export function GlobalHealthStatusProvider() {
  return <GlobalHealthStatusButton variant="floating" position="bottom-right" />;
}

