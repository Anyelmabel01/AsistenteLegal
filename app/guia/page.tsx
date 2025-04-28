import React from 'react';

export default function GuiaPage() {
  return (
    <div className="prose prose-lg max-w-none bg-white p-6 rounded-lg shadow">
      {/* Use prose classes for nice typography defaults */}
      <h1>Guía del Asistente Legal</h1>

      <section>
        <h2>¿Cómo funciona el chat?</h2>
        <p>
          Interactuar con el Asistente Legal es sencillo. Simplemente escribe tus consultas legales
          en el cuadro de texto al final de la pantalla y presiona Enter o haz clic en el botón de enviar.
          El asistente utilizará la información de los documentos legales que has subido y su conocimiento general
          para proporcionarte una respuesta.
        </p>
        <p>
          Recuerda que el asistente está diseñado para ofrecer orientación basada en la información disponible,
          pero <strong>no reemplaza el consejo de un abogado profesional</strong> para situaciones complejas o específicas.
        </p>
      </section>

      <section>
        <h2>Ejemplos de Preguntas Legales</h2>
        <p>Puedes preguntar sobre diversos temas. Aquí tienes algunos ejemplos:</p>
        
        <h3>Derecho Laboral (Panamá)</h3>
        <ul>
          <li>"¿Cuál es el preaviso mínimo para renunciar a mi trabajo según la ley panameña?"</li>
          <li>"Explícame las causas justificadas de despido según el Código de Trabajo de Panamá."</li>
          <li>"¿Cómo se calculan las vacaciones y el décimo tercer mes en Panamá?"</li>
          <li>"¿Qué dice la ley sobre la licencia de maternidad en Panamá?"</li>
        </ul>

        <h3>Derecho Mercantil / Sociedades (Panamá)</h3>
        <ul>
          <li>"¿Cuáles son los requisitos para constituir una sociedad anónima en Panamá?"</li>
          <li>"Resume las responsabilidades de un director en una sociedad anónima panameña."</li>
          <li>"¿Qué es un aviso de operación y quiénes lo necesitan en Panamá?"</li>
          <li>"Explica la diferencia entre una S.A. y una S. de R.L. en Panamá."</li>
        </ul>
        
        <h3>Basadas en tus Documentos (Ejemplos)</h3>
        <ul>
          <li>"Según el contrato [nombre del contrato], ¿cuál es la cláusula de terminación anticipada?"</li>
          <li>"Resume los puntos clave de la Ley [número de ley] sobre [tema específico]."</li>
          <li>"¿Qué dice la Constitución de Panamá sobre el derecho a la propiedad privada?"</li>
          <li>"Busca jurisprudencia relevante sobre casos de incumplimiento de contrato de arrendamiento."</li>
        </ul>
        
         <p className="mt-4">
          ¡Sé específico en tus preguntas para obtener mejores resultados! Puedes pedir resúmenes, explicaciones,
          comparaciones o buscar artículos específicos dentro de las leyes o documentos cargados.
        </p>
      </section>
    </div>
  );
} 