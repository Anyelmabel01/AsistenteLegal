// Funcionalidades del Asistente Legal de Panamá

export interface Feature {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
  color: string;
}

export const LEGAL_FEATURES: Feature[] = [
  {
    id: 'chat',
    name: 'Chat Legal General',
    description: 'Consultas generales de derecho panameño con lenguaje claro y fundamentos legales',
    prompt: 'CHAT_LEGAL_PROMPT',
    icon: '💬',
    color: 'royal'
  },
  {
    id: 'analisis-documento',
    name: 'Análisis de Documentos',
    description: 'Análisis detallado de contratos, demandas, jurisprudencia y normativas',
    prompt: 'ANALISIS_DOCUMENTO_PROMPT',
    icon: '📄',
    color: 'navy'
  },
  {
    id: 'investigacion',
    name: 'Investigación Jurídica',
    description: 'Investigación profunda con búsqueda de jurisprudencia y precedentes',
    prompt: 'MODO_INVESTIGACION_PROMPT',
    icon: '🔍',
    color: 'gold'
  },
  {
    id: 'casos-legales',
    name: 'Gestión de Casos',
    description: 'Clasificación, etapas procesales y estrategias según el Código Judicial',
    prompt: 'CASOS_LEGALES_PROMPT',
    icon: '📋',
    color: 'royal'
  },
  {
    id: 'notificaciones',
    name: 'Alertas Legales',
    description: 'Transformación de leyes nuevas y decretos en mensajes claros y concisos',
    prompt: 'NOTIFICACION_PROMPT',
    icon: '🔔',
    color: 'legal-red'
  },
  {
    id: 'sitios-oficiales',
    name: 'Guía de Trámites',
    description: 'Enlaces directos a sitios oficiales con información de requisitos y procesos',
    prompt: 'SITIOS_OFICIALES_PROMPT',
    icon: '🏛️',
    color: 'navy'
  }
];

export function getFeatureById(id: string): Feature | undefined {
  return LEGAL_FEATURES.find(feature => feature.id === id);
}

export function getActiveFeatures(
  searchMode: boolean, 
  researchMode: boolean, 
  hasPDF: boolean
): Feature[] {
  const activeFeatures: Feature[] = [];
  
  if (hasPDF) {
    const docAnalysis = getFeatureById('analisis-documento');
    if (docAnalysis) activeFeatures.push(docAnalysis);
  }
  
  if (researchMode) {
    const investigation = getFeatureById('investigacion');
    if (investigation) activeFeatures.push(investigation);
  } else if (searchMode) {
    const chat = getFeatureById('chat');
    if (chat) activeFeatures.push(chat);
  } else {
    const chat = getFeatureById('chat');
    if (chat) activeFeatures.push(chat);
  }
  
  return activeFeatures;
}

// Tipos de documentos soportados
export const DOCUMENT_TYPES = [
  { value: 'contrato', label: 'Contrato', icon: '📝' },
  { value: 'demanda', label: 'Demanda', icon: '⚖️' },
  { value: 'jurisprudencia', label: 'Jurisprudencia', icon: '📚' },
  { value: 'ley', label: 'Ley/Normativa', icon: '📜' },
  { value: 'resolucion', label: 'Resolución', icon: '📋' },
  { value: 'decreto', label: 'Decreto', icon: '🏛️' },
  { value: 'escritura', label: 'Escritura Pública', icon: '📄' },
  { value: 'poder', label: 'Poder Legal', icon: '🤝' },
  { value: 'otro', label: 'Otro Documento', icon: '📃' }
];

// Sitios oficiales de Panamá
export const OFFICIAL_SITES = [
  {
    name: 'Órgano Judicial',
    url: 'https://www.organojudicial.gob.pa',
    description: 'Consultas judiciales, expedientes y jurisprudencia',
    icon: '⚖️',
    category: 'judicial'
  },
  {
    name: 'Registro Público',
    url: 'https://www.registro-publico.gob.pa',
    description: 'Registros de propiedades, sociedades y marcas',
    icon: '📋',
    category: 'registros'
  },
  {
    name: 'MITRADEL',
    url: 'https://www.mitradel.gob.pa',
    description: 'Asuntos laborales y de trabajo',
    icon: '💼',
    category: 'laboral'
  },
  {
    name: 'Asamblea Nacional',
    url: 'https://www.asamblea.gob.pa',
    description: 'Leyes, proyectos y normativa vigente',
    icon: '🏛️',
    category: 'legislativo'
  },
  {
    name: 'DGI - Dirección General de Ingresos',
    url: 'https://www.dgi.gob.pa',
    description: 'Trámites tributarios y fiscales',
    icon: '💰',
    category: 'tributario'
  },
  {
    name: 'Superintendencia de Bancos',
    url: 'https://www.superbancos.gob.pa',
    description: 'Regulación financiera y bancaria',
    icon: '🏦',
    category: 'financiero'
  }
];