/**
 * Typed API client for the TryAIGap frontend.
 *
 * - Injects `Authorization: Bearer <access_token>` and `Accept-Language`.
 * - Parses the backend error envelope `{error:{code,message,field,request_id}}`
 *   into an `ApiError`.
 * - Standalone Mock Fallback: When no backend is running (demo branch deployment),
 *   transparently responds with mock data so all views and flows are fully functional.
 */
import { API_URL } from '@/config';
import {
  mockAnswersMaturity,
  mockAreas,
  mockAssessment,
  mockCases,
  mockConsultantClients,
  mockConsultantKpis,
  mockDocuments,
  mockMetadata,
  mockOrg,
  mockPricing,
  mockQuestionnaireMaturity,
  mockResults,
  mockTeam,
  mockUser,
} from './mockData';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly field?: string | null;
  readonly requestId?: string;

  constructor(
    status: number,
    body: { code: string; message: string; field?: string | null; request_id?: string },
  ) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.field = body.field ?? null;
    this.requestId = body.request_id;
  }
}

// ---------- token storage (localStorage) ----------
const ACCESS_KEY = 'tryaigap.access_token';
const REFRESH_KEY = 'tryaigap.refresh_token';

export const tokenStorage = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ---------- pluggable hooks (avoid circular imports) ----------
let languageProvider: () => string = () => 'es';
export function setLanguageProvider(provider: () => string): void {
  languageProvider = provider;
}

let sessionExpiredHandler: (() => void) | null = null;
export function setSessionExpiredHandler(handler: () => void): void {
  sessionExpiredHandler = handler;
}

// ---------- refresh (single-flight) ----------
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    const p = (async (): Promise<boolean> => {
      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) return false;
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept-Language': languageProvider() },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { access_token: string; refresh_token?: string };
        tokenStorage.set(data.access_token, data.refresh_token ?? refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
    refreshPromise = p;
  }
  return refreshPromise;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
  headers?: Record<string, string>;
  auth?: boolean;
}

export function getMockData<T>(path: string, _options: RequestOptions = {}): T {
  const cleanPath = path.split('?')[0];

  if (cleanPath === '/metadata') return mockMetadata as unknown as T;
  if (cleanPath === '/auth/magic-link') {
    tokenStorage.set('mock-access-token', 'mock-refresh-token');
    return { status: 'success', message: 'Magic link generado exitosamente (Modo Demo)' } as unknown as T;
  }
  if (cleanPath === '/auth/verify') {
    tokenStorage.set('mock-access-token', 'mock-refresh-token');
    return {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      expires_in: 86400,
      user: { id: mockUser.id, email: mockUser.email, role: mockUser.role, locale: mockUser.locale },
    } as unknown as T;
  }
  if (cleanPath === '/auth/refresh') {
    return {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      expires_in: 86400,
    } as unknown as T;
  }
  if (cleanPath === '/auth/me') return mockUser as unknown as T;
  if (cleanPath === '/auth/logout') return undefined as unknown as T;

  if (cleanPath === '/leads') {
    tokenStorage.set('mock-access-token', 'mock-refresh-token');
    return {
      organization: mockOrg,
      assessment: mockAssessment,
      tokens: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token', token_type: 'bearer', expires_in: 86400 },
      user: { id: mockUser.id, email: mockUser.email, role: mockUser.role, locale: mockUser.locale },
    } as unknown as T;
  }

  if (cleanPath.startsWith('/organizations/')) return mockOrg as unknown as T;

  if (cleanPath === '/assessments/current' || cleanPath.startsWith('/assessments/asm_')) {
    if (cleanPath.includes('/answers:batch')) {
      return { saved: 20, failed: [] } as unknown as T;
    }
    if (cleanPath.includes('/answers')) {
      return mockAnswersMaturity as unknown as T;
    }
    if (cleanPath.includes(':activate')) {
      return { area_key: 'operations', active: true, progress: 85 } as unknown as T;
    }
    if (cleanPath.includes('/areas')) {
      return mockAreas as unknown as T;
    }
    return mockAssessment as unknown as T;
  }

  if (cleanPath.startsWith('/areas/') && cleanPath.endsWith('/cases')) {
    return mockCases as unknown as T;
  }

  if (cleanPath === '/questionnaires') return mockQuestionnaireMaturity as unknown as T;

  if (cleanPath.startsWith('/results/')) return mockResults as unknown as T;

  if (cleanPath === '/pricing') return mockPricing as unknown as T;

  if (cleanPath === '/estimator/quote') {
    return {
      quote_id: 'q_mock_01',
      subtotal: 1250,
      discount: 0,
      total: 1250,
      currency: 'USD',
      line_items: [
        { code: 'ASSESSMENT_PRO', label: 'Diagnóstico 5D + 7 Áreas', quantity: 1, unit_price: 490, total: 490 },
        { code: 'VALIDATION', label: 'Validación por Consultor Senior', quantity: 1, unit_price: 400, total: 400 },
        { code: 'HOURS_PACK', label: 'Sesiones de Consultoría Estratégica (2h)', quantity: 2, unit_price: 180, total: 360 },
      ],
    } as unknown as T;
  }

  if (cleanPath === '/distributor-codes/validate') {
    return { valid: true, discount_pct: 15, distributor_name: 'Partner Duoc UC (Demo)' } as unknown as T;
  }

  if (cleanPath === '/payments/checkout-session') {
    return {
      id: 'cs_mock_demo',
      checkout_url: '/payment/checkout?session=cs_mock_demo&payment_id=pay_demo_01',
      payment_id: 'pay_demo_01',
    } as unknown as T;
  }

  if (cleanPath.startsWith('/payments/')) {
    return {
      id: 'pay_demo_01',
      status: 'succeeded',
      amount: 1250,
      currency: 'USD',
      created_at: new Date().toISOString(),
    } as unknown as T;
  }

  if (cleanPath === '/webhooks/stripe') {
    return { received: true } as unknown as T;
  }

  if (cleanPath.startsWith('/reviews')) {
    return {
      id: 'rev_demo_01',
      assessment_id: 'asm_demo_01',
      status: 'approved',
      consultant_name: 'Consultor Senior Duoc UC',
      comments: 'Excelente nivel de madurez inicial. Plan de adopción viable a 90 días.',
      created_at: new Date().toISOString(),
    } as unknown as T;
  }

  if (cleanPath === '/team') return mockTeam as unknown as T;
  if (cleanPath.startsWith('/invitations')) {
    return { invitation_id: 'inv_mock_01', status: 'sent' } as unknown as T;
  }

  if (cleanPath.startsWith('/documents')) return mockDocuments as unknown as T;

  if (cleanPath === '/consultant/kpis') return mockConsultantKpis as unknown as T;
  if (cleanPath.startsWith('/consultant/clients/')) {
    return {
      ...mockConsultantClients.items[0],
      organization: mockOrg,
      assessment: mockAssessment,
      notes: [],
    } as unknown as T;
  }
  if (cleanPath === '/consultant/clients') return mockConsultantClients as unknown as T;

  if (cleanPath.startsWith('/delegations/')) {
    return {
      id: 'del_01',
      question_id: 'mat_est_01',
      question_title: 'Visión y Estrategia de IA',
      question_description: 'Validar presupuesto y patrocinio ejecutivo.',
      delegate_email: 'delegado@empresa.cl',
      scale_min: 1,
      scale_max: 5,
    } as unknown as T;
  }

  return {} as unknown as T;
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Accept-Language': languageProvider(),
    ...options.headers,
  };

  let body: string | FormData | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  if (options.auth !== false) {
    const token = tokenStorage.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? (body !== undefined ? 'POST' : 'GET'),
      headers,
      body,
    });
  } catch {
    if (import.meta.env.MODE === 'test') {
      throw new ApiError(0, { code: 'NETWORK_ERROR', message: 'Network request failed' });
    }
    return getMockData<T>(path, options);
  }

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as {
      error?: { code?: string; message?: string; field?: string | null; request_id?: string };
    } | null;
    const err = payload?.error;
    const apiErr = new ApiError(res.status, {
      code: err?.code ?? `HTTP_${res.status}`,
      message: err?.message ?? res.statusText,
      field: err?.field ?? null,
      request_id: err?.request_id,
    });
    if (import.meta.env.MODE === 'test') {
      throw apiErr;
    }
    // In standalone browser mode, if 404 or backend down, fallback to mock
    if (res.status === 404 || res.status >= 500) {
      return getMockData<T>(path, options);
    }
    throw apiErr;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (e) {
    const retriable =
      e instanceof ApiError &&
      e.status === 401 &&
      options.auth !== false &&
      !path.startsWith('/auth/refresh');
    if (retriable) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return await rawRequest<T>(path, options);
      }
      tokenStorage.clear();
      sessionExpiredHandler?.();
    }
    throw e;
  }
}

async function rawBlobRequest(path: string): Promise<Blob> {
  const headers: Record<string, string> = { 'Accept-Language': languageProvider() };
  const token = tokenStorage.getAccess();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers });
  } catch {
    if (import.meta.env.MODE === 'test') {
      throw new ApiError(0, { code: 'NETWORK_ERROR', message: 'Network request failed' });
    }
    return new Blob(['Reporte Demo PDF TryAIGap'], { type: 'application/pdf' });
  }
  if (!res.ok) {
    if (import.meta.env.MODE === 'test') {
      const payload = (await res.json().catch(() => null)) as {
        error?: { code?: string; message?: string };
      } | null;
      throw new ApiError(res.status, {
        code: payload?.error?.code ?? `HTTP_${res.status}`,
        message: payload?.error?.message ?? res.statusText,
      });
    }
    return new Blob(['Reporte Demo PDF TryAIGap'], { type: 'application/pdf' });
  }
  return res.blob();
}

export async function apiBlob(path: string): Promise<Blob> {
  try {
    return await rawBlobRequest(path);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) return await rawBlobRequest(path);
      tokenStorage.clear();
      sessionExpiredHandler?.();
    }
    throw e;
  }
}
