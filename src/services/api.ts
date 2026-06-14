// src/services/api.ts

import { apiFetch } from '../config/api';

// ─────────────────────────────
// TYPES
// ─────────────────────────────

export interface ApiError {
  message: string;
}

export interface Errand {
  id: string;
  title: string;
  description?: string;
  budget?: number;
  price?: number;
  status: string;
  pickup_location?: string;
  delivery_location?: string;
}

// ─────────────────────────────
// HELPERS
// ─────────────────────────────

async function handleResponse(res: any) {
  if (!res.res.ok) {
    throw {
      message: res.data?.message || 'Request failed',
    } as ApiError;
  }

  return res.data;
}

// ─────────────────────────────
// CLIENT APIs
// ─────────────────────────────

export async function getClientErrands() {
  const res = await apiFetch('/api/errands/client');
  return handleResponse(res);
}

export async function confirmErrand(id: string) {
  const res = await apiFetch(`/api/errands/${id}/confirm`, {
    method: 'POST',
  });

  return handleResponse(res);
}

// ─────────────────────────────
// RUNNER APIs
// ─────────────────────────────

export async function getOpenErrands(): Promise<Errand[]> {
  const res = await apiFetch('/api/errands/open');
  return handleResponse(res);
}

export async function acceptErrand(id: string) {
  const res = await apiFetch(`/api/errands/${id}/accept`, {
    method: 'POST',
  });

  return handleResponse(res);
}

// ─────────────────────────────
// CREATE ERRAND
// ─────────────────────────────

export async function createErrand(payload: {
  title: string;
  description: string;
  budget?: number;
  pickup_location?: string;
  delivery_location?: string;
}) {
  const res = await apiFetch('/api/errands', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}