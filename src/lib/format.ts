export const TODAY = '2026-10-14'
export const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
export const fmtShort = (iso: string) => { const [, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}` }
export const fmtTime = (iso: string) => iso.slice(11, 16)
export const fmtDateTime = (iso: string) => `${fmtDate(iso)} ${fmtTime(iso)}`
export const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`
export const num = (n: number) => n.toLocaleString('pt-BR')
export const initials = (name: string) => {
  const p = name.replace(/\(.*\)/, '').trim().split(/\s+/)
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
}
export const tenure = (iso: string) => {
  const a = new Date(iso), b = new Date(TODAY)
  const days = Math.round((+b - +a) / 86400000)
  if (days < 60) return `${days}d`
  let months = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth()
  if (b.getDate() < a.getDate()) months--
  const y = Math.floor(months / 12), m = months % 12
  if (y === 0) return `${m}m`
  return m ? `${y}a${m}m` : `${y}a`
}
export const tenureLong = (iso: string) => {
  const t = tenure(iso)
  const y = /(\d+)a/.exec(t), m = /(\d+)m/.exec(t), d = /^(\d+)d$/.exec(t)
  if (d) return `${d[1]} dias`
  const parts: string[] = []
  if (y) parts.push(`${y[1]} ano${y[1] === '1' ? '' : 's'}`)
  if (m) parts.push(`${m[1]} ${m[1] === '1' ? 'mês' : 'meses'}`)
  return parts.join(' e ')
}
export const daysBetween = (a: string, b: string) => Math.round((+new Date(b) - +new Date(a)) / 86400000)
export const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
export const addMonths = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00'); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10) }
