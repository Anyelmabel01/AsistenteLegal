import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../supabaseClient';
import { generateEmbedding } from '../perplexity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, userId, limit = 5, threshold = 0.7 } = req.body;

  if (!query || !userId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Generar embedding para la consulta
    const embedding = await generateEmbedding(query);
    
    if (!embedding) {
      return res.status(500).json({ error: 'No se pudo generar el embedding para la consulta' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not initialized' });
    }
    
    // Realizar búsqueda semántica usando la función match_documents de Supabase
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error al realizar búsqueda:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ results: data });
  } catch (error: any) {
    console.error('Error en búsqueda semántica:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
} 