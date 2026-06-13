import { Alert } from 'react-native';
import { apiFetch } from '../config/api';

// ─── Types ─────────────────────────────────────────

export type ErrandStatus = 'open' | 'accepted' | 'confirmed';
export type EscrowStatus = 'held' | 'awaiting_confirmation' | 'released';

export type TransactionType = 'payment' | 'refund' | 'escrow' | 'release';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

// ─── Core Models ───────────────────────────────────

export interface Errand {
  id: string;
  title: string;
  description: string;
  status: ErrandStatus;
  price: number | null;
  client_id: string;
  assigned_runner_id: string | null;
  escrow_status: EscrowStatus | null;
  pickup_location: string | null;
  delivery_location: string | null;
  budget: number | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  errand_id: string | null;
  client_id: string | null;
  runner_id: string | null;
  created_at: string;
}

export interface CreateErrandPayload {
  title: string;
  description: string;
  price?: number;
  budget?: number;
  pickup_location?: string;
  delivery_location?: string;
}

// ─── Error ─────────────────────────────────────────

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

// ─── Auth Context Injection ─────────────────────────

interface ApiUser {
  id: string;
  role: 'client' | 'runner';
}

let _user: ApiUser | null = null;

export function setApiUser(user: ApiUser | null) {
  _user = user;
}

// ─── Device Security ───────────────────────────────

import { getDeviceId } from '../utils/device';

async function getHeaders(): Promise<Record<string, string>> {
  if (!_user) throw new ApiError(401, 'Not authenticated');

  const deviceId = await getDeviceId();

  return {
    'Content-Type': 'application/json',
    'x-user-id': _user.id,
    'x-role': _user.role,
    'x-device-id': deviceId,
  };
}

// ─── Core Request Engine ───────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getHeaders();

  const { data, res } = await apiFetch(path, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!data) {
    Alert.alert('Error', 'Invalid server response');
    throw new ApiError(res.status, 'Invalid server response');
  }

  if (!res.ok) {
    throw new ApiError(res.status, data?.message || 'Request failed');
  }

  return data as T;
}

// ─── Errands ───────────────────────────────────────

export function getClientErrands(): Promise<Errand[]> {
  return request('/errands');
}

export function createErrand(payload: CreateErrandPayload): Promise<Errand> {
  return request('/errands', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function confirmErrand(id: string): Promise<Errand> {
  return request(`/errands/${id}/confirm`, {
    method: 'POST',
  });
}

export function getOpenErrands(): Promise<Errand[]> {
  return request('/errands');
}

export function acceptErrand(id: string): Promise<Errand> {
  return request(`/errands/${id}/accept`, {
    method: 'POST',
  });
}

// ─── Transactions ─────────────────────────────────

export function getTransactions(): Promise<Transaction[]> {
  return request('/transactions');
}

// ─── Paystack (External Banking) ──────────────────

export interface Bank {
  name: string;
  code: string;
}

export interface AccountResolution {
  account_name: string;
  account_number: string;
  bank_code: string;
}

export interface Recipient {
  recipient_code: string;
}

export function getPaystackBanks(): Promise<Bank[]> {
  return request('/paystack/banks');
}

export function resolveAccount(
  account_number: string,
  bank_code: string
): Promise<AccountResolution> {
  return request('/paystack/resolve-account', {
    method: 'POST',
    body: JSON.stringify({ account_number, bank_code }),
  });
}

export function createRecipient(
  account_number: string,
  bank_code: string,
  name: string
): Promise<Recipient> {
  return request('/paystack/recipient', {
    method: 'POST',
    body: JSON.stringify({
      account_number,
      bank_code,
      name,
    }),
  });
}

// ─── User Bank Accounts ───────────────────────────

export interface BankAccount {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
}

export function getUserBanks(): Promise<BankAccount[]> {
  return request('/banks');
}

export function createBank(
  data: Omit<BankAccount, 'id' | 'is_default'>
) {
  return request<BankAccount>('/banks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function setDefaultBank(id: string) {
  return request(`/banks/${id}/default`, {
    method: 'PATCH',
  });
}

export function deleteBank(id: string) {
  return request(`/banks/${id}`, {
    method: 'DELETE',
  });
}

// ─── Withdrawal ───────────────────────────────────

export function withdrawWithPin(
  amount: number,
  pin: string
): Promise<{ success: boolean; message: string; requireOtp?: boolean }> {
  return request('/withdraw', {
    method: 'POST',
    body: JSON.stringify({ amount, pin }),
  });
}
