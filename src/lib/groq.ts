export const apiKey = import.meta.env.VITE_GROQ_API_KEY

export interface DiagnosisSuggestion {
  clave: string
  descripcion: string
  probabilidad: number
  explicacion: string
}

export const SYSTEM_PROMPT_PRESCRIPTION = `Eres un médico colegiado con amplia experiencia clínica. 
Tu tarea es generar recetas médicas precisas, estructuradas y profesionales.

Para cada receta debes incluir:
1. Medicamento(s) con dosis exacta
2. Frecuencia y duración del tratamiento
3. Instrucciones de uso claras
4. Recomendaciones adicionales si es necesario
5. Advertencias o contraindicaciones relevantes

Usa un formato profesional y médico. Sé conciso pero completo.`

export const SYSTEM_PROMPT_DIAGNOSIS = `Eres un médico colegiado experto en diagnósticos CIE-10.
Tu tarea es analizar los síntomas del paciente y determinar los códigos CIE-10 más probables.

INSTRUCCIONES CRÍTICAS:
1. Analiza los síntomas y conviértelos en diagnósticos médicos precisos
2. Asigna porcentajes REALES (1-100%), NUNCA todos iguales
3. Cada diagnóstico debe tener un porcentaje ÚNICO y DIFERENTE
4. Basa los porcentajes en evidencia clínica real
5. Rango sugerido: 90-99% muy probable, 70-89% probable, 40-69% posible, 10-39% poco probable

Responde EXCLUSIVAMENTE en formato JSON:
[
  {
    "clave": "código CIE-10",
    "descripcion": "descripción del diagnóstico",
    "probabilidad": 87,
    "explicacion": "explicación médica clara de por qué este porcentaje"
  }
]

IMPORTANTE: Solo JSON, sin texto adicional. Cada probabilidad debe ser un número entero único.`

export async function callGroqAPI(messages: any[], model = 'llama-3.1-8b-instant') {
  if (!apiKey) {
    throw new Error('Missing Groq API key. Configure VITE_GROQ_API_KEY.')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `HTTP error! status: ${response.status}`)
  }

  return await response.json()
}
