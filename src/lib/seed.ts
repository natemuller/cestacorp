import type { DB, Employee, TrackLink, User } from './types'
import employees from '../data/employees.json'
import managers from '../data/managers.json'
import roles from '../data/roles.json'
import courses from '../data/courses.json'
import enrollments from '../data/enrollments.json'
import certificates from '../data/certificates.json'
import alerts from '../data/alerts.json'
import audit from '../data/audit.json'
import evalSeed from '../data/evaluations_seed.json'
import cycle from '../data/cycle.json'
import pdiData from '../data/pdi.json'
import pins from '../data/pins.json'
import feedback from '../data/feedback.json'

const lastAccess: Record<string, string> = { marieri: 'hoje 11:42', patrick: 'ontem', ana: 'hoje 11:20', juliana: '12/10', bruna: '13/10', fernando: '03/08' }

function buildUsers(): User[] {
  const mg: User[] = managers.map((m) => ({ id: m.id, name: m.name, email: m.email, profile: 'gestao', lastAccess: lastAccess[m.id] ?? '—', status: 'active' }))
  const emps: User[] = (employees as Employee[]).map((e) => ({
    id: e.id, name: e.name, email: e.email, profile: 'colaborador',
    lastAccess: e.id === 'diego' ? '—' : (lastAccess[e.id] ?? '12/10'),
    status: e.status === 'inactive' ? 'disabled' : e.id === 'diego' ? 'invited' : 'active',
  }))
  return [...mg, ...emps]
}

// Trilhas por cargo: o cargo "Analista Fiscal Júnior" usa a trilha real da Natan; os demais ganham uma trilha-base.
function buildTrackLinks(): TrackLink[] {
  const rules: Record<string, string> = {
    c3: 'Até 60 dias da admissão · renovar a cada 24 meses', c1: 'Até 90 dias da admissão', c9: 'Até 31/10/2026',
    c10: 'Até 120 dias da admissão', c12: 'Na 1ª semana · renovar a cada 12 meses',
  }
  const out: TrackLink[] = []
  const junior = (enrollments as { courseId: string; origin: string }[]).filter((e) => e.origin === 'Trilha').map((e) => e.courseId)
  const juniorList = ['c3', 'c1', 'c9', 'c12', ...junior.filter((c) => !['c3', 'c1', 'c9', 'c12'].includes(c))]
  for (const c of juniorList) out.push({ roleId: 'fiscal-junior', courseId: c, mandatory: true, rule: rules[c] ?? 'Até 90 dias da admissão' })
  for (const r of roles) {
    if (r.id === 'fiscal-junior') continue
    for (const c of ['c12', 'c19', 'c2', 'c1', 'c5']) out.push({ roleId: r.id, courseId: c, mandatory: true, rule: rules[c] ?? 'Até 90 dias da admissão' })
  }
  return out
}

export function buildSeed(): DB {
  return {
    employees: employees as Employee[],
    managers,
    roles: roles as DB['roles'],
    courses,
    enrollments: enrollments as DB['enrollments'],
    certificates: certificates as DB['certificates'],
    alerts: alerts as DB['alerts'],
    audit,
    evaluations: evalSeed as unknown as DB['evaluations'],
    cycleRows: cycle.rows as DB['cycleRows'],
    cycleStages: cycle.stages,
    pdi: pdiData.ana as DB['pdi'],
    pdiDrafts: pdiData.drafts as DB['pdiDrafts'],
    pins,
    feedback: feedback as DB['feedback'],
    users: buildUsers(),
    trackLinks: buildTrackLinks(),
    hoursByMonth: [4, 6, 3, 8, 5, 2, 7, 4, 1, 6],
    prefs: { atraso: [true, true], cert: [true, true], prazos: [true, false], aval: [true, true], conq: [true, false] },
    profileExtra: { phone: '(51) 9 8888-0000', modality: 'Híbrido · terças e quintas no escritório', education: 'Ciências Contábeis (7º semestre)' },
    goals: pdiData.ana.goals,
  }
}
