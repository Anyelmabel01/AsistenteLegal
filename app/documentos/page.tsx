'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authSafe';
import { getUserDocuments } from '../../utils/documentService';
import DocumentTable from '../../components/DocumentTable';
import DocumentUploader from '../../components/DocumentUploader';
import DocumentList from '../../components/DocumentList';
import UpdatesPanel from '../../components/UpdatesPanel';
import NotificationCenter from '../../components/NotificationCenter';
import { 
  DocumentTextIcon, 
  ArrowUpTrayIcon, 
  BellIcon, 
  NewspaperIcon,
  FolderIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

// Define the Document type
interface Document {
  id: string | number;
  file_name: string;
  document_type: string;
  source: string;
  status?: string;
  created_at?: string;
}

export default function DocumentosPage() {
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('documents');

  useEffect(() => {
    const loadUserDocuments = async () => {
      if (!user) {
        setIsLoadingDocs(false);
        setDocuments([]);
        return;
      }

      setIsLoadingDocs(true);
      setError(null);
      try {
        const result = await getUserDocuments(user.id);
        if (result.success && result.documents) {
          setDocuments(result.documents);
        } else {
          console.error('Error al cargar documentos:', result.error);
          setError('No se pudieron cargar los documentos.');
          setDocuments([]);
        }
      } catch (err: any) {
        console.error('Error al cargar documentos:', err);
        setError(`Error al cargar documentos: ${err.message}`);
        setDocuments([]);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    if (!authLoading) {
      loadUserDocuments();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-6">🔐</div>
        <h2 className="text-2xl font-bold text-navy mb-4">Acceso Restringido</h2>
        <p className="text-navy-600 mb-8">Necesitas iniciar sesión para gestionar documentos</p>
        <p className="text-steel-600">👆 Usa el botón "Iniciar Sesión" arriba para continuar</p>
      </div>
    );
  }

  const tabs = [
    { id: 'documents', name: 'Documentos', icon: DocumentTextIcon },
    { id: 'updates', name: 'Actualizaciones', icon: NewspaperIcon },
    { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-royal to-royal-700 text-white rounded-3xl p-8 shadow-xl">
          <div className="text-4xl mb-4">📄</div>
          <h1 className="text-4xl font-heading font-bold mb-4">Centro de Documentos</h1>
          <p className="text-xl font-body text-royal-100">
            Gestiona documentos, consulta actualizaciones legales y revisa notificaciones
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-steel-100">
        <div className="border-b border-steel-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 py-4 px-6 font-medium text-sm border-b-2 transition-all duration-200
                    ${isActive 
                      ? 'border-royal text-royal bg-royal-50' 
                      : 'border-transparent text-navy-600 hover:text-royal hover:border-royal hover:bg-royal-25'
                    }
                  `}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'documents' && (
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-royal-50 to-royal-100 rounded-xl p-6 border border-royal-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-royal-600 font-medium">Documentos Totales</p>
                      <p className="text-2xl font-bold text-royal">{documents.length}</p>
                    </div>
                    <FolderIcon className="w-8 h-8 text-royal" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-gold-50 to-gold-100 rounded-xl p-6 border border-gold-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gold-700 font-medium">Analizados</p>
                      <p className="text-2xl font-bold text-gold">
                        {documents.filter(doc => doc.status === 'completed').length}
                      </p>
                    </div>
                    <ChartBarIcon className="w-8 h-8 text-gold" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-steel-50 to-steel-100 rounded-xl p-6 border border-steel-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-steel-600 font-medium">Pendientes</p>
                      <p className="text-2xl font-bold text-steel-700">
                        {documents.filter(doc => doc.status !== 'completed').length}
                      </p>
                    </div>
                    <ArrowUpTrayIcon className="w-8 h-8 text-steel-600" />
                  </div>
                </div>
              </div>

              {/* Document Management */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-steel-50 rounded-2xl p-6">
                  <div className="flex items-center mb-6">
                    <ArrowUpTrayIcon className="w-6 h-6 text-royal mr-3" />
                    <h2 className="text-xl font-heading font-bold text-navy">Subir Nuevo Documento</h2>
                  </div>
                  <DocumentUploader />
                </div>

                <div className="bg-steel-50 rounded-2xl p-6">
                  <div className="flex items-center mb-6">
                    <DocumentTextIcon className="w-6 h-6 text-royal mr-3" />
                    <h2 className="text-xl font-heading font-bold text-navy">Mis Documentos</h2>
                  </div>
                  {error && <p className="text-red-500 mb-4">{error}</p>}
                  <DocumentTable documents={documents} isLoading={isLoadingDocs} />
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 text-center shadow-md border border-steel-100">
                  <div className="text-3xl text-royal mb-3">🔍</div>
                  <h3 className="font-heading font-semibold text-navy mb-2">Análisis Automático</h3>
                  <p className="text-steel-600 font-body">
                    Lexi analiza automáticamente cada documento que subas
                  </p>
                </div>
                
                <div className="bg-white rounded-xl p-6 text-center shadow-md border border-steel-100">
                  <div className="text-3xl text-gold mb-3">💡</div>
                  <h3 className="font-heading font-semibold text-navy mb-2">Extracción de Datos</h3>
                  <p className="text-steel-600 font-body">
                    Identifica fechas importantes, partes involucradas y elementos clave
                  </p>
                </div>
                
                <div className="bg-white rounded-xl p-6 text-center shadow-md border border-steel-100">
                  <div className="text-3xl text-legal-red mb-3">⚠️</div>
                  <h3 className="font-heading font-semibold text-navy mb-2">Alertas Legales</h3>
                  <p className="text-steel-600 font-body">
                    Recibe notificaciones sobre plazos y acciones requeridas
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <NewspaperIcon className="w-6 h-6 text-royal mr-3" />
                <h2 className="text-2xl font-heading font-bold text-navy">Actualizaciones Legales Recientes</h2>
              </div>
              <p className="text-navy-600 mb-6 font-body">
                Mantente al día con las últimas actualizaciones de las fuentes legales que estás siguiendo.
              </p>
              <UpdatesPanel />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <BellIcon className="w-6 h-6 text-royal mr-3" />
                <h2 className="text-2xl font-heading font-bold text-navy">Centro de Notificaciones</h2>
              </div>
              <p className="text-navy-600 mb-6 font-body">
                Revisa tus notificaciones personalizadas sobre actualizaciones legales relevantes para ti.
              </p>
              <NotificationCenter />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 