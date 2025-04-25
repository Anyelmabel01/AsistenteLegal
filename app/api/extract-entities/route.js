import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * API route para extraer entidades utilizando spaCy a través de Python
 * Nota: Requiere tener Python y spaCy instalados en el servidor
 */
export async function POST(request) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'El texto es requerido' },
        { status: 400 }
      );
    }
    
    // Crear un archivo temporal con el texto para procesar
    const tempDir = os.tmpdir();
    const tempInputFile = path.join(tempDir, `legal_text_${Date.now()}.txt`);
    const tempOutputFile = path.join(tempDir, `entities_${Date.now()}.json`);
    
    // Escribir el texto en el archivo temporal
    await fs.writeFile(tempInputFile, text, 'utf-8');
    
    // Ejecutar script de Python con spaCy
    // Nota: Este script debe estar creado previamente en la carpeta /scripts
    const pythonScript = path.join(process.cwd(), 'scripts', 'extract_entities.py');
    
    const { entities, error } = await runSpacyScript(pythonScript, tempInputFile, tempOutputFile);
    
    // Limpiar archivos temporales
    try {
      await fs.unlink(tempInputFile);
      await fs.unlink(tempOutputFile);
    } catch (cleanupError) {
      console.error('Error al eliminar archivos temporales:', cleanupError);
    }
    
    if (error) {
      return NextResponse.json(
        { error: `Error al procesar entidades: ${error}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ entities });
    
  } catch (err) {
    console.error('Error en el procesamiento de entidades:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Ejecuta el script de Python para procesar el texto con spaCy
 */
function runSpacyScript(scriptPath, inputFile, outputFile) {
  return new Promise((resolve) => {
    const command = `python "${scriptPath}" "${inputFile}" "${outputFile}"`;
    
    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar script de Python: ${error.message}`);
        console.error(`Stderr: ${stderr}`);
        resolve({ entities: [], error: error.message });
        return;
      }
      
      try {
        // Leer resultados del archivo de salida
        const data = await fs.readFile(outputFile, 'utf-8');
        const entities = JSON.parse(data);
        resolve({ entities });
      } catch (readError) {
        console.error('Error al leer archivo de entidades:', readError);
        resolve({ entities: [], error: readError.message });
      }
    });
  });
} 