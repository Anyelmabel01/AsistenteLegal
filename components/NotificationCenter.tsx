'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabaseClient';
import { useAuth } from '../src/contexts/auth';

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  source: string;
  link?: string;
  read: boolean;
  created_at: string;
};

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Suscribirse a notificaciones en tiempo real
      const notificationSubscription = supabase
        .channel('user_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          // Añadir nueva notificación a la lista
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(notificationSubscription);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (filter === 'unread') {
        query = query.eq('read', false);
      } else if (filter === 'read') {
        query = query.eq('read', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Re-fetch cuando cambia el filtro
    if (user) {
      fetchNotifications();
    }
  }, [filter]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', id);
      
      if (error) throw error;
      
      // Actualizar estado local
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .in('id', unreadIds);
      
      if (error) throw error;
      
      // Actualizar estado local
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Eliminar de la lista local
      setNotifications(notifications.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllRead = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar todas las notificaciones leídas?')) return;
    
    try {
      const readIds = notifications.filter(n => n.read).map(n => n.id);
      
      if (readIds.length === 0) return;
      
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .in('id', readIds);
      
      if (error) throw error;
      
      // Eliminar de la lista local
      setNotifications(notifications.filter(notification => !notification.read));
    } catch (error) {
      console.error('Error clearing read notifications:', error);
    }
  };

  // Formatea la fecha para mostrarla en formato amigable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-PA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      {/* Filtros y acciones */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'unread'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            No leídas
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'read'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Leídas
          </button>
        </div>
        
        <div className="space-x-2">
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Marcar todo como leído
          </button>
          <button
            onClick={clearAllRead}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Eliminar notificaciones leídas
          </button>
        </div>
      </div>
      
      {/* Lista de notificaciones */}
      {notifications.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">No tienes notificaciones {filter !== 'all' ? (filter === 'unread' ? 'sin leer' : 'leídas') : ''}</p>
          <p className="text-sm text-gray-400 mt-2">Las notificaciones aparecerán aquí cuando haya actualizaciones de tus fuentes suscritas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative border rounded-lg p-4 shadow-sm transition-all ${
                notification.read
                  ? 'border-gray-200 bg-white'
                  : 'border-blue-300 bg-blue-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{notification.title}</h3>
                  <p className="text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                      {notification.source}
                    </span>
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
                      title="Marcar como leído"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
                    title="Eliminar notificación"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="mt-2 text-gray-700">{notification.message}</p>
              {notification.link && (
                <div className="mt-3">
                  <a
                    href={notification.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    Ver documento
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )}
              {!notification.read && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 