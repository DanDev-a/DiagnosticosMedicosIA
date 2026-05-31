export interface Diagnosis {
  clave: string
  descripcion: string
  tipo: 'diagnostico' | 'procedimiento'
}

export interface PatientInfo {
  name: string
  age: string
  gender: string
  date: string
}
