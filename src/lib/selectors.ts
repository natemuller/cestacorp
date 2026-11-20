import type { DB, Employee, Enrollment, Level } from './types'
import { TODAY, fmtDateTime } from './format'

export const ME = 'ana'
export const emp = (db: DB, id: string) => db.employees.find((e) => e.id === id)
export const role = (db: DB, id: string) => db.roles.find((r) => r.id === id)
export const course = (db: DB, id: string) => db.courses.find((c) => c.id === id)!
export const roleName = (db: DB, e: Employee) => role(db, e.roleId)?.name ?? ''
export const peopleInRole = (db: DB, roleId: string) => db.employees.filter((e) => e.roleId === roleId && e.status !== 'inactive').length + (role(db, roleId)?.extraPeople ?? 0)

export const trailItems = (db: DB) => db.enrollments.filter((e) => e.origin === 'Trilha')
export const doneTrail = (db: DB) => trailItems(db).filter((e) => e.status === 'done' || e.status === 'validating').length
export const trailPct = (db: DB) => Math.round((doneTrail(db) / trailItems(db).length) * 100)
export const hoursYear = (db: DB) => db.hoursByMonth.reduce((a, b) => a + b, 0)
export const meRank = (db: DB) => {
  const ranked = [...db.employees].filter((e) => e.status !== 'inactive').sort((a, b) => b.points - a.points)
  const pos = ranked.findIndex((e) => e.id === ME) + 1
  const area = ranked.filter((e) => e.area === emp(db, ME)!.area)
  return { ranked, pos, areaPos: area.findIndex((e) => e.id === ME) + 1, above: ranked[pos - 2] }
}
export const statusOf = (e: Enrollment): Enrollment['status'] => (e.status !== 'done' && e.status !== 'validating' && e.due < TODAY ? 'overdue' : e.status)
export const STATUS_LABEL: Record<string, string> = { done: 'Concluído', inprogress: 'Em andamento', todo: 'Não iniciado', overdue: 'Vencido', validating: 'Em validação' }
export const STATUS_TONE: Record<string, string> = { done: 'green', inprogress: '', todo: 'gray', overdue: 'red', validating: '' }

export const addAudit = (d: DB, user: string, module: string, action: string, record: string, before = '', after = '') => {
  d.audit.unshift({ id: 'au' + Date.now() + Math.random().toString(36).slice(2, 5), at: TODAY + 'T12:00', user, module, action, record, before, after })
}
export const pushAlert = (d: DB, profile: 'colaborador' | 'gestao', a: { cat: string; tone: string; title: string; text: string; to: string; cta?: string }) => {
  d.alerts.unshift({ id: 'al' + Date.now() + Math.random().toString(36).slice(2, 5), profile, group: 'today', time: '12:00', cta: a.cta ?? null, read: false, ...a })
}
export const certStatusLabel = (s: string) => ({ valid: 'Válido', expiring: 'A vencer', expired: 'Vencido', validating: 'Em validação' }[s] ?? s)

export const LEVELS: { id: Level; label: string }[] = [{ id: 'nao', label: 'Não atende' }, { id: 'parcial', label: 'Parcial' }, { id: 'pleno', label: 'Pleno' }, { id: 'supera', label: 'Supera' }]
export const levelLabel = (l?: Level) => (l ? LEVELS.find((x) => x.id === l)!.label : '—')
// Avaliação padrão para colaboradores sem registro detalhado
export const getEval = (db: DB, id: string) => db.evaluations[id] ?? {
  auto: { k1: 'pleno', k2: 'pleno', k3: 'pleno', s1: 'pleno', s2: 'pleno', s3: 'pleno', t1: 'pleno', t2: 'pleno', t3: 'pleno' }, autoComment: '', goals: '',
  gestora: {}, gestoraComment: '', consenso: {}, consensoComment: '', suggestions: {},
}
export const now = () => fmtDateTime(TODAY + 'T12:00')
