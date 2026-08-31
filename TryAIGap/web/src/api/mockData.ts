import type {
  AnswerListResponse,
  AreaListResponse,
  AssessmentSummary,
  CasesResponse,
  ConsultantClientItem,
  ConsultantKpis,
  DocumentListItem,
  MeResponse,
  Organization,
  Page,
  PricingResponse,
  QuestionnaireOut,
  ResultOut,
  TeamListResponse,
} from './types';
import type { MetadataResponse } from './index';

export function getDemoPlan(): string {
  if (typeof window === 'undefined') return 'pro';
  return localStorage.getItem('tryaigap.demo_plan') || 'pro';
}

export function setDemoPlan(plan: 'free' | 'pro'): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tryaigap.demo_plan', plan);
  }
  mockOrg.plan = plan;
  mockAssessment.plan = plan;
}

export const mockUser: MeResponse = {
  id: 'usr_demo_01',
  email: 'demo@tryaigap.io',
  full_name: 'Fabrizio Martínez (Demo)',
  role: 'admin',
  locale: 'es',
  organization_id: 'org_demo_01',
};

export const mockOrg: Organization = {
  id: 'org_demo_01',
  name: 'Empresa Demo S.A. (Fase Inicial)',
  sector: 'tecnologia',
  size: '50-249',
  country: 'CL',
  currency: 'USD',
  plan: getDemoPlan(),
  settings: {
    doc_locale: 'es',
    theme: 'dark',
    logo_url: null,
  },
};

export const mockMetadata: MetadataResponse = {
  sizes: ['1-9', '10-49', '50-249', '250-999', '1000+'],
  industries: [
    'tecnologia',
    'servicios_financieros',
    'salud',
    'retail',
    'manufactura',
    'educacion',
    'logistica',
    'otro',
  ],
  countries: ['CL', 'MX', 'CO', 'PE', 'AR', 'ES', 'US'],
  currencies: ['USD', 'CLP', 'EUR', 'MXN'],
  frameworks: ['EU AI Act', 'NIST AI RMF', 'ISO/IEC 42001', 'Ley IA Chile'],
};

export const mockAssessment: AssessmentSummary = {
  id: 'asm_demo_01',
  organization_id: 'org_demo_01',
  plan: getDemoPlan(),
  status: 'in_progress',
  started_at: '2026-08-25T10:00:00Z',
  completed_at: null,
  progress: {
    maturity: 80,
    areas_overall: 70,
  },
  free_preview_reached: false,
};

export const mockQuestionnaireMaturity: QuestionnaireOut = {
  module: 'maturity',
  locale: 'es',
  blocks: [
    {
      id: 'blk_est',
      title: 'Estrategia de IA',
      dimension: 'Estrategia',
      questions: [
        { id: 'mat_est_01', code: 'EST-01', text: '¿Cuenta la organización con una hoja de ruta formal de adopción de IA?' },
        { id: 'mat_est_02', code: 'EST-02', text: '¿Existe asignación presupuestaria y respaldo de la alta dirección?' },
      ],
    },
    {
      id: 'blk_per',
      title: 'Personas y Cultura',
      dimension: 'Personas',
      questions: [
        { id: 'mat_per_01', code: 'PER-01', text: '¿Se imparten programas de alfabetización digital y desarrollo de competencias?' },
        { id: 'mat_per_02', code: 'PER-02', text: '¿Existe un plan estructurado para gestionar el cambio y adopción?' },
      ],
    },
    {
      id: 'blk_pro',
      title: 'Procesos Operativos',
      dimension: 'Procesos',
      questions: [
        { id: 'mat_pro_01', code: 'PRO-01', text: '¿Se han mapeado e identificado los flujos operativos candidatos a automatización?' },
      ],
    },
    {
      id: 'blk_dat',
      title: 'Datos y Gobernanza',
      dimension: 'Datos',
      questions: [
        { id: 'mat_dat_01', code: 'DAT-01', text: '¿Dispone la empresa de políticas claras de integridad, privacidad y calidad de datos?' },
      ],
    },
    {
      id: 'blk_tec',
      title: 'Tecnología e Infraestructura',
      dimension: 'Tecnología',
      questions: [
        { id: 'mat_tec_01', code: 'TEC-01', text: '¿Se cuenta con arquitectura escalable y controles de seguridad para modelos de IA?' },
      ],
    },
  ],
};

export const mockAnswersMaturity: AnswerListResponse = {
  items: [
    { question_id: 'mat_est_01', code: 'EST-01', value: 4, state: 'answered' },
    { question_id: 'mat_est_02', code: 'EST-02', value: 3, state: 'answered' },
    { question_id: 'mat_per_01', code: 'PER-01', value: 4, state: 'answered' },
    { question_id: 'mat_per_02', code: 'PER-02', value: 3, state: 'answered' },
    { question_id: 'mat_pro_01', code: 'PRO-01', value: 4, state: 'answered' },
    { question_id: 'mat_dat_01', code: 'DAT-01', value: 5, state: 'answered' },
    { question_id: 'mat_tec_01', code: 'TEC-01', value: 4, state: 'answered' },
  ],
  meta: { total: 7 },
};

export const mockAreas: AreaListResponse = {
  items: [
    { area_key: 'operations', name: 'Operaciones y Logística', active: true, progress: 85, locked: false, leader: 'Carlos Gómez' },
    { area_key: 'it', name: 'Tecnología e Infraestructura', active: true, progress: 90, locked: false, leader: 'Fabrizio Martínez' },
    { area_key: 'finance', name: 'Finanzas y Contabilidad', active: true, progress: 70, locked: false, leader: 'Laura Peña' },
    { area_key: 'hr', name: 'Recursos Humanos y Talento', active: true, progress: 80, locked: false, leader: 'Andrea Rivas' },
    { area_key: 'marketing', name: 'Marketing y Crecimiento', active: true, progress: 75, locked: false, leader: 'Felipe Soto' },
    { area_key: 'legal', name: 'Legal, Riesgo y Cumplimiento', active: true, progress: 65, locked: false, leader: 'Marcela Silva' },
    { area_key: 'sales', name: 'Ventas y Clientes', active: true, progress: 80, locked: false, leader: 'Rodrigo Toro' },
  ],
};

export const mockCases: CasesResponse = {
  area_key: 'operations',
  cases: [
    { name: 'Optimización de Rutas de Entrega', family: 'Logística', kpi: 'Reducción de combustible 15%', effort: 'Medio', maturity: 'Nivel 3', stage: 'Priorizado' },
    { name: 'Mantenimiento Predictivo', family: 'Maquinaria', kpi: 'Disponibilidad 99.2%', effort: 'Alto', maturity: 'Nivel 4', stage: 'En evaluación' },
    { name: 'Control de Stock Automatizado', family: 'Inventario', kpi: 'Rotación +20%', effort: 'Bajo', maturity: 'Nivel 2', stage: 'Quick Win' },
  ],
};

export const mockResults: ResultOut = {
  maturity: {
    average: 3.85,
    level: 'Nivel 4 — Avanzado',
    dimensions: [
      { key: 'strategy', label: 'Estrategia', score: 3.8 },
      { key: 'people', label: 'Personas', score: 3.5 },
      { key: 'processes', label: 'Procesos', score: 4.0 },
      { key: 'data', label: 'Datos', score: 4.2 },
      { key: 'technology', label: 'Tecnología', score: 3.7 },
    ],
  },
  heatmap: {
    vectors: ['Gobernanza', 'Riesgos', 'Talento', 'Datos', 'Casos de Uso'],
    areas: [
      { name: 'Operaciones', row: [4, 3, 4, 5, 4] },
      { name: 'Tecnología', row: [5, 4, 4, 5, 5] },
      { name: 'Finanzas', row: [3, 3, 3, 4, 3] },
      { name: 'RRHH', row: [3, 2, 4, 3, 3] },
      { name: 'Marketing', row: [4, 3, 4, 4, 4] },
      { name: 'Legal', row: [4, 5, 3, 4, 2] },
      { name: 'Ventas', row: [4, 3, 3, 4, 4] },
    ],
  },
  priorities: [
    { initiative: 'Formalizar Comité de Ética de IA', area: 'Legal', vector: 'Gobernanza', pain: 4, readiness: 4, recommendation: 'Establecer estatutos y marco ISO 42001 a 30 días.' },
    { initiative: 'Asistente IA de Soporte al Cliente', area: 'Ventas', vector: 'Casos de Uso', pain: 5, readiness: 4, recommendation: 'Piloto con LLMs supervisados para reducir tiempos de respuesta.' },
    { initiative: 'Plan de Capacitación y Reskilling', area: 'RRHH', vector: 'Talento', pain: 3, readiness: 5, recommendation: 'Certificación en herramientas de IA generativa.' },
  ],
};

export const mockPricing: PricingResponse = {
  currency: 'USD',
  base_price: 490,
  area_review: 150,
  support_session: 180,
  final_report_validation: 400,
};

export const mockTeam: TeamListResponse = {
  items: [
    { member_id: 'mem_01', email: 'demo@tryaigap.io', name: 'Fabrizio Martínez', role: 'admin', status: 'active', area_key: 'it' },
    { member_id: 'mem_02', email: 'consultor@tryaigap.io', name: 'Consultor Especialista', role: 'consultant', status: 'active', area_key: null },
    { member_id: 'mem_03', email: 'auditor@empresa.cl', name: 'Auditor de Calidad', role: 'client', status: 'active', area_key: 'legal' },
  ],
  invitations: [],
};

export const mockDocuments: Page<DocumentListItem> = {
  items: [
    { id: 'doc_01', filename: 'Politica_Gobernanza_Datos_2026.pdf', size_bytes: 1420500, mime_type: 'application/pdf', created_at: '2026-08-28T14:00:00Z', area_key: 'it', uploaded_by_name: 'Fabrizio Martínez' },
    { id: 'doc_02', filename: 'Plan_Estrategico_IA_V1.pdf', size_bytes: 2840000, mime_type: 'application/pdf', created_at: '2026-08-28T15:30:00Z', area_key: 'operations', uploaded_by_name: 'Fabrizio Martínez' },
  ],
  meta: { page: 1, page_size: 10, total: 2, total_pages: 1 },
};

export const mockConsultantKpis: ConsultantKpis = {
  leads: 12,
  active_engagements: 4,
  avg_maturity: 3.85,
  free_to_paid_conversion_pct: 35.5,
};

export const mockConsultantClients: Page<ConsultantClientItem> = {
  items: [
    { client_id: 'org_demo_01', name: 'Empresa Demo S.A.', sector: 'tecnologia', plan: 'pro', progress: 75, maturity: 3.85, status: 'in_progress', last_activity: '2026-08-28T18:00:00Z' },
    { client_id: 'org_02', name: 'Banco Financiero Austral', sector: 'finanzas', plan: 'enterprise', progress: 95, maturity: 4.4, status: 'completed', last_activity: '2026-08-27T12:00:00Z' },
  ],
  meta: { page: 1, page_size: 10, total: 2, total_pages: 1 },
};
