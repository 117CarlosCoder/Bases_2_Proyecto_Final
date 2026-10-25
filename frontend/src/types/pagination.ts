export interface Pagina<T> {
  items: T[]
  total: number
  pagina: number
  limite: number
  paginas: number
  paginaAnterior: number | null
  paginaSiguiente: number | null
}
