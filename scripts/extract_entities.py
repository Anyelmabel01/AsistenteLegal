#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para extraer entidades de documentos legales usando spaCy
Uso: python extract_entities.py input_file.txt output_file.json
"""

import sys
import json
import spacy
from pathlib import Path

# Cargar el modelo en español de spaCy (asegúrate de haberlo descargado con: python -m spacy download es_core_news_lg)
try:
    nlp = spacy.load("es_core_news_lg")
except OSError:
    print("Error: Modelo de spaCy 'es_core_news_lg' no encontrado.")
    print("Instálalo con: python -m spacy download es_core_news_lg")
    sys.exit(1)

# Entidades legales específicas para añadir al pipeline
legal_entities = {
    "ley": "LAW",
    "artículo": "LAW",
    "código": "LAW",
    "decreto": "LAW",
    "resolución": "LAW",
    "sentencia": "LAW",
    "jurisprudencia": "LAW",
    "norma": "NORM",
    "regulación": "NORM",
    "reglamento": "NORM",
    "estatuto": "NORM",
}

def extract_entities(text):
    """Extrae entidades del texto usando spaCy con enfoque en entidades legales"""
    doc = nlp(text)
    
    # Lista para almacenar todas las entidades encontradas
    entities = []
    
    # Procesar entidades estándar reconocidas por spaCy
    for ent in doc.ents:
        entity = {
            "text": ent.text,
            "start": ent.start_char,
            "end": ent.end_char,
            "type": ent.label_,
            "description": spacy.explain(ent.label_)
        }
        entities.append(entity)
    
    # Detección de entidades legales personalizadas
    # Esta es una implementación simple, se podría mejorar con un modelo personalizado
    for token in doc:
        lower_text = token.text.lower()
        if lower_text in legal_entities:
            # Buscar la frase completa (ej: "Artículo 123", "Ley 45 de 2007")
            if token.i < len(doc) - 1:  # Asegurar que hay tokens después
                next_token = doc[token.i + 1]
                if next_token.is_digit or next_token.text.isdigit():
                    # Expandir hasta encontrar el final de la referencia legal
                    end_idx = token.i + 2
                    while end_idx < len(doc) and (doc[end_idx].is_digit or 
                                                doc[end_idx].text.lower() in ["de", "del", "y", ","]):
                        end_idx += 1
                    
                    # Extraer la mención legal completa
                    legal_mention = doc[token.i:end_idx]
                    
                    entity = {
                        "text": legal_mention.text,
                        "start": legal_mention.start_char,
                        "end": legal_mention.end_char,
                        "type": legal_entities[lower_text],
                        "description": f"Referencia legal: {lower_text}"
                    }
                    
                    # Evitar duplicados
                    if not any(e["start"] == entity["start"] and e["end"] == entity["end"] for e in entities):
                        entities.append(entity)
    
    return entities

def main():
    # Verificar argumentos
    if len(sys.argv) != 3:
        print("Uso: python extract_entities.py input_file.txt output_file.json")
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])
    
    # Verificar que el archivo de entrada existe
    if not input_file.exists():
        print(f"Error: El archivo {input_file} no existe")
        sys.exit(1)
    
    try:
        # Leer archivo de texto
        with open(input_file, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # Extraer entidades
        entities = extract_entities(text)
        
        # Guardar entidades en formato JSON
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(entities, f, ensure_ascii=False, indent=2)
        
        print(f"Procesamiento completado. Se encontraron {len(entities)} entidades.")
        
    except Exception as e:
        print(f"Error al procesar el archivo: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 