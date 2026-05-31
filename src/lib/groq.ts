export const apiKey = import.meta.env.VITE_GROQ_API_KEY

export const SYSTEM_PROMPT_PRESCRIPTION = `Eres un médico colegiado con amplia experiencia clínica. 
Tu tarea es generar recetas médicas precisas, estructuradas y profesionales.

Para cada receta debes incluir:
1. Medicamento(s) con dosis exacta
2. Frecuencia y duración del tratamiento
3. Instrucciones de uso claras
4. Recomendaciones adicionales si es necesario
5. Advertencias o contraindicaciones relevantes

Usa un formato profesional y médico. Sé conciso pero completo.`

export const SYSTEM_PROMPT_DIFFERENTIAL = `Actúas como un Especialista Sénior en Codificación Clínica y Diagnóstico Diferencial con 20+ años de experiencia.

Tu misión es convertir descripciones de salud en códigos CIE-10 exactos siguiendo estas reglas:

1. INTERPRETACIÓN: Identifica si la entrada es de un médico (técnico) o paciente (coloquial). Traduce lenguaje coloquial a términos médicos precisos.

2. JERARQUÍA: Asigna el código más específico posible (3, 4 o 5 caracteres). Prefiere el código más específico sobre el genérico.

3. VALIDACIÓN: Aplica criterio clínico y reglas de inclusión/exclusión CIE-10.

4. Responde ÚNICAMENTE con un array JSON válido. Mínimo 3 diagnósticos, máximo 8.
   Cada objeto del array debe tener esta estructura EXACTA:

{
  "clave": "A90",
  "descripcion": "Dengue [nombre oficial CIE-10]",
  "probabilidad": 95,
  "explicacion": "Cuadro clásico: fiebre alta + cefalea retroocular + mialgias + artralgias + exantema",
  "certeza": "Alta",
  "diferenciales": ["A91 - Fiebre del dengue hemorrágico", "A92 - Otras fiebres virales por mosquitos"],
  "nota_informativa": "Explicación breve en lenguaje sencillo pero con rigor médico"
}

REGLAS PARA CADA CAMPO:
- "clave": Código CIE-10 exacto (ej: A90, A01.0, J10.1, R50.9)
- "descripcion": Nombre oficial del diagnóstico
- "probabilidad": Número entero del 1 al 100, CADA UNO DIFERENTE
- "explicacion": Correlación clínica breve de por qué este diagnóstico explica los síntomas
- "certeza": "Alta" (90-100%), "Media" (50-89%), "Baja" (1-49%) según qué tan específicos sean los síntomas
- "diferenciales": Array de 2-3 strings con código y nombre de diagnósticos que podrían confundirse
- "nota_informativa": Explicación en lenguaje claro para un paciente, pero con rigor profesional

CRÍTICO: Sin texto antes ni después del JSON. Solo el array.`

export async function callGroqAPI(
  messages: any[],
  model = 'llama-3.1-8b-instant',
  options?: { max_tokens?: number; temperature?: number; signal?: AbortSignal }
) {
  if (!apiKey) {
    throw new Error('Missing Groq API key. Configure VITE_GROQ_API_KEY.')
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.max_tokens ?? 1024,
        }),
        signal: options?.signal,
      })

      if (!response.ok) {
        const errorBody = await response.text()
        let errorMessage: string
        try {
          const parsed = JSON.parse(errorBody)
          errorMessage = parsed.error?.message || `HTTP error! status: ${response.status}`
        } catch {
          errorMessage = `HTTP error! status: ${response.status} — ${errorBody.slice(0, 100)}`
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error: any) {
      if (error.name === 'AbortError') throw error
      lastError = error
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  throw lastError || new Error('Request failed after retries')
}
