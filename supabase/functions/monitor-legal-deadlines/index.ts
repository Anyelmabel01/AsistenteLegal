// Supabase Edge Function para monitorizar y alertar sobre plazos legales
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format, addDays, differenceInDays } from 'https://esm.sh/date-fns@2';

// Inicializamos el cliente de Supabase desde las variables de entorno
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface Deadline {
  id: string;
  case_id: string;
  description: string;
  deadline_date: string;
  is_completed: boolean;
  created_at: string;
  user_id: string;
  notification_sent: boolean;
}

interface Case {
  id: string;
  title: string;
  user_id: string;
}

interface User {
  id: string;
  email: string;
}

interface Notification {
  id?: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at?: string;
}

// Esta función se ejecuta como un CRON job
Deno.serve(async (req) => {
  try {
    // Crear cliente de Supabase con service role para acceso completo
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // 1. Obtener todos los plazos legales pendientes (no completados)
    const { data: deadlines, error: deadlinesError } = await supabase
      .from('legal_deadlines')
      .select('*, cases:case_id(title, user_id)')
      .eq('is_completed', false)
      .eq('notification_sent', false);
    
    if (deadlinesError) {
      throw new Error(`Error al obtener plazos: ${deadlinesError.message}`);
    }
    
    // 2. Actualizar plazos y enviar notificaciones
    const today = new Date();
    const notifications: Notification[] = [];
    const deadlineUpdates: {id: string}[] = [];
    
    for (const deadline of deadlines as (Deadline & {cases: Case})[]) {
      const deadlineDate = new Date(deadline.deadline_date);
      const daysRemaining = differenceInDays(deadlineDate, today);
      
      // Alertar sobre plazos a punto de vencer (7 días o menos)
      if (daysRemaining <= 7 && daysRemaining >= 0) {
        // Crear notificación para el usuario
        const notification: Notification = {
          user_id: deadline.cases.user_id,
          title: '⚠️ Plazo legal próximo a vencer',
          content: `El plazo "${deadline.description}" para el caso "${deadline.cases.title}" vence en ${daysRemaining} días (${format(deadlineDate, 'dd/MM/yyyy')}).`,
          type: 'deadline',
          is_read: false
        };
        
        notifications.push(notification);
        deadlineUpdates.push({ id: deadline.id });
      }
      
      // Alertar sobre plazos vencidos (ya pasó la fecha)
      if (daysRemaining < 0) {
        const notification: Notification = {
          user_id: deadline.cases.user_id,
          title: '🚨 Plazo legal vencido',
          content: `El plazo "${deadline.description}" para el caso "${deadline.cases.title}" venció hace ${Math.abs(daysRemaining)} días (${format(deadlineDate, 'dd/MM/yyyy')}).`,
          type: 'deadline_expired',
          is_read: false
        };
        
        notifications.push(notification);
        deadlineUpdates.push({ id: deadline.id });
      }
    }
    
    // 3. Insertar notificaciones en la base de datos
    if (notifications.length > 0) {
      const { error: notificationsError } = await supabase
        .from('notifications')
        .insert(notifications);
      
      if (notificationsError) {
        throw new Error(`Error al crear notificaciones: ${notificationsError.message}`);
      }
      
      // 4. Actualizar los plazos como notificados
      const { error: updateError } = await supabase
        .from('legal_deadlines')
        .update({ notification_sent: true })
        .in('id', deadlineUpdates.map(du => du.id));
      
      if (updateError) {
        throw new Error(`Error al actualizar plazos: ${updateError.message}`);
      }
    }
    
    return new Response(
      JSON.stringify({
        message: `Monitoreo completado. Se enviaron ${notifications.length} notificaciones de plazos.`
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error en la función de monitoreo de plazos:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}); 