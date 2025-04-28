'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabaseClient';
import { useAuth } from '../src/contexts/auth';

type Subscription = {
  id: string;
  source: string;
  user_id: string;
  created_at: string;
  active: boolean;
  email_notifications: boolean;
  frequency: 'immediately' | 'daily' | 'weekly';
};

type Source = {
  id: string;
  name: string;
  description: string;
};

export default function SubscriptionManager() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [newSubscription, setNewSubscription] = useState<string>('');
  const [notificationPreference, setNotificationPreference] = useState<'immediately' | 'daily' | 'weekly'>('immediately');

  useEffect(() => {
    if (user) {
      fetchUserSubscriptions();
      fetchAvailableSources();
    }
  }, [user]);

  const fetchUserSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSources = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_sources')
        .select('*');

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const toggleSubscriptionStatus = async (id: string, currentStatus: boolean) => {
    try {
      setUpdating(id);
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar la lista local
      setSubscriptions(subscriptions.map(sub => 
        sub.id === id ? { ...sub, active: !currentStatus } : sub
      ));
    } catch (error) {
      console.error('Error updating subscription:', error);
    } finally {
      setUpdating(null);
    }
  };

  const toggleEmailNotification = async (id: string, currentStatus: boolean) => {
    try {
      setUpdating(id);
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ email_notifications: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar la lista local
      setSubscriptions(subscriptions.map(sub => 
        sub.id === id ? { ...sub, email_notifications: !currentStatus } : sub
      ));
    } catch (error) {
      console.error('Error updating notification preference:', error);
    } finally {
      setUpdating(null);
    }
  };

  const updateFrequency = async (id: string, frequency: 'immediately' | 'daily' | 'weekly') => {
    try {
      setUpdating(id);
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ frequency })
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar la lista local
      setSubscriptions(subscriptions.map(sub => 
        sub.id === id ? { ...sub, frequency } : sub
      ));
    } catch (error) {
      console.error('Error updating frequency:', error);
    } finally {
      setUpdating(null);
    }
  };

  const addSubscription = async () => {
    if (!newSubscription || !user) return;
    
    try {
      // Verificar si la suscripción ya existe
      const existingSubscription = subscriptions.find(sub => sub.source === newSubscription);
      
      if (existingSubscription) {
        alert('Ya estás suscrito a esta fuente');
        return;
      }
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          source: newSubscription,
          active: true,
          email_notifications: true,
          frequency: notificationPreference
        })
        .select();

      if (error) throw error;
      
      if (data) {
        setSubscriptions([...subscriptions, ...data]);
        setNewSubscription('');
      }
    } catch (error) {
      console.error('Error adding subscription:', error);
    }
  };

  const removeSubscription = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta suscripción?')) return;
    
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Eliminar de la lista local
      setSubscriptions(subscriptions.filter(sub => sub.id !== id));
    } catch (error) {
      console.error('Error removing subscription:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sección para añadir nueva suscripción */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium mb-4">Añadir nueva suscripción</h3>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuente legal</label>
            <select
              value={newSubscription}
              onChange={(e) => setNewSubscription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione una fuente</option>
              {sources.map((source) => (
                <option key={source.id} value={source.name}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-52">
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia de notificaciones</label>
            <select
              value={notificationPreference}
              onChange={(e) => setNotificationPreference(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="immediately">Inmediatamente</option>
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={addSubscription}
              disabled={!newSubscription}
              className={`p-2 rounded-md text-sm font-medium ${
                !newSubscription
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Suscribirse
            </button>
          </div>
        </div>
      </div>
      
      {/* Lista de suscripciones */}
      <div>
        <h3 className="text-lg font-medium mb-4">Mis suscripciones</h3>
        
        {subscriptions.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No tienes suscripciones activas</p>
            <p className="text-sm text-gray-400 mt-2">Suscríbete a una fuente legal para recibir actualizaciones</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fuente
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notificaciones
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frecuencia
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subscription.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleSubscriptionStatus(subscription.id, subscription.active)}
                        disabled={updating === subscription.id}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          subscription.active ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            subscription.active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleEmailNotification(subscription.id, subscription.email_notifications)}
                        disabled={updating === subscription.id}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          subscription.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            subscription.email_notifications ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={subscription.frequency}
                        onChange={(e) => updateFrequency(subscription.id, e.target.value as any)}
                        disabled={updating === subscription.id}
                        className="border border-gray-300 rounded-md text-sm p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="immediately">Inmediatamente</option>
                        <option value="daily">Diariamente</option>
                        <option value="weekly">Semanalmente</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => removeSubscription(subscription.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 