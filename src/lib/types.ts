export type Level = 'nao' | 'parcial' | 'pleno' | 'supera'

export interface Employee {
  id: string; name: string; email: string; roleId: string; area: string; admission: string
  status: 'active' | 'onboarding' | 'inactive'; modality: string; points: number
  trailPct: number; pdiPct: number | null; hours: number; trainings: number
  phone: string; birth: string; education: string
}
export interface Manager { id: string; name: string; email: string; title: string; short: string }
export interface Role {
  id: string; name: string; area: string; level: string; min: number; max: number; bolsa?: boolean
  reportsTo: string; prev: string | null; next: string | null; extraPeople: number; promotion: string
  responsibilities?: string[]; knowledge?: string[]; skills?: string[]; attitudes?: string[]
  indicators?: { name: string; target: string }[]; education?: string; experience?: string
  trackHours?: number; trackCourses?: number
}
export interface Course {
  id: string; name: string; competence: string; entity: string; modality: string
  hours: number; value: number; site: string; roles: number
}
export type EnrollStatus = 'done' | 'inprogress' | 'todo' | 'overdue' | 'validating'
export interface Enrollment { courseId: string; origin: 'Trilha' | 'PDI'; status: EnrollStatus; due: string; doneAt: string | null }
export interface Certificate {
  id: string; ownerId: string; title: string; ext: string; size: string; source: string
  code: string | null; issued: string; expires: string | null
  status: 'valid' | 'expiring' | 'expired' | 'validating'; courseId: string | null
}
export interface Alert {
  id: string; profile: 'colaborador' | 'gestao'; cat: string; group: 'today' | 'week'; time: string
  tone: string; title: string; text: string; cta: string | null; to: string; read: boolean
}
export interface AuditRow { id: string; at: string; user: string; module: string; action: string; record: string; before: string; after: string }
export interface EvalRecord {
  auto: Partial<Record<string, Level>>; autoComment: string; goals: string
  gestora: Partial<Record<string, Level>>; gestoraComment: string
  consenso: Partial<Record<string, Level>>; consensoComment: string
  suggestions: Record<string, boolean>
}
export interface CycleRow { auto: string; gestora: string; consenso: string; pdi: string }
export interface PdiAction {
  id: string; what: string; how: string; who: string; due: string; courseId: string | null
  track?: string; trackNote?: string; status?: 'progress' | 'late' | 'done'; follow?: string
}
export interface Pin { id: string; name: string; desc: string; got: boolean }
export interface FeedbackRec {
  stage: number; scores: Record<string, number>; strengths: string; develop: string; agreed: string
  employeeView: string; done: boolean
}
export interface User { id: string; name: string; email: string; profile: 'colaborador' | 'gestao'; lastAccess: string; status: 'active' | 'invited' | 'disabled' }
export interface TrackLink { roleId: string; courseId: string; mandatory: boolean; rule: string }

export interface DB {
  employees: Employee[]; managers: Manager[]; roles: Role[]; courses: Course[]
  enrollments: Enrollment[]; certificates: Certificate[]; alerts: Alert[]; audit: AuditRow[]
  evaluations: Record<string, EvalRecord>; cycleRows: Record<string, CycleRow>
  cycleStages: { n: number; name: string; from: string; to: string; done: number; total: number }[]
  pdi: {
    period: string; next: string; generatedFrom: string; goals: string
    path: { name: string; year: string }[]; actions: PdiAction[]
  }
  pdiDrafts: Record<string, { status: 'draft' | 'published'; generatedAt: string; actions: PdiAction[] }>
  pins: Pin[]; feedback: Record<string, FeedbackRec>; users: User[]
  trackLinks: TrackLink[]
  hoursByMonth: number[]; prefs: Record<string, [boolean, boolean]>
  profileExtra: { phone: string; modality: string; education: string }
  goals: string
}
export interface Personal {
  self: Employee; roleName: string; managerName: string; managerTitle: string
  enrollments: Enrollment[]; certificates: Certificate[]; pdi: DB['pdi']; pins: Pin[]
  hoursByMonth: number[]; profileExtra: DB['profileExtra']; goals: string
  evaluation: EvalRecord; cycle: CycleRow
  history: [string, string, string, string][]
  painel: {
    banner: { tone: string; title: string; text: string; cta: string; to: string }
    trailFoot: string; hoursFoot: string; hoursGoal: number; areaLabel: string; chartNote: string
    results: [string, string, number, string][]
  }
}
export interface Session { email: string; profile: 'colaborador' | 'gestao'; personId: string; name: string; subtitle: string; initials: string }
