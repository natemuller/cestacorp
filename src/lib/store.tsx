import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DB, Personal, Session } from './types'
import { mineOf } from './personal'
import { ANA } from './ana'
import { buildSeed } from './seed'
import { TODAY } from './format'

const DB_KEY = 'cestacorp-demo-db-v3'
const SESSION_KEY = 'cestacorp-demo-session-v3'

export const DEMO_ACCOUNTS = [
  { email: 'colaborador@email.com', password: 'cesta123', profile: 'colaborador' as const, personId: 'ana', name: 'Natan Muller', subtitle: 'Analista Fiscal Júnior', initials: 'NM' },
  { email: 'gestor@email.com', password: 'cesta123', profile: 'gestao' as const, personId: 'marieri', name: 'Luana Thurow', subtitle: 'Sócia-diretora · Gestão', initials: 'LT' },
]

const read = <T,>(k: string): T | null => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : null } catch { return null } }
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }

interface Toast { id: number; msg: string }
interface Ctx {
  db: DB
  update: (fn: (d: DB) => void) => void
  session: Session | null
  login: (email: string, password: string) => string | null
  logout: () => void
  reset: () => void
  toast: (msg: string) => void
  toasts: Toast[]
  today: string
}
const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => read<DB>(DB_KEY) ?? buildSeed())
  const [session, setSession] = useState<Session | null>(() => read<Session>(SESSION_KEY))
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => { write(DB_KEY, db) }, [db])
  useEffect(() => { if (session) write(SESSION_KEY, session); else try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ } }, [session])

  const update = useCallback((fn: (d: DB) => void) => {
    setDb((prev) => { const next = structuredClone(prev); fn(next); return next })
  }, [])
  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])
  const login = useCallback((email: string, password: string) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
    if (!acc || acc.password !== password) return 'E-mail ou senha inválidos.'
    setSession({ email: acc.email, profile: acc.profile, personId: acc.personId, name: acc.name, subtitle: acc.subtitle, initials: acc.initials })
    return null
  }, [])
  const logout = useCallback(() => setSession(null), [])
  const reset = useCallback(() => { setDb(buildSeed()); toast('Demo resetada para o estado inicial.') }, [toast])

  const value = useMemo(() => ({ db, update, session, login, logout, reset, toast, toasts, today: TODAY }), [db, update, session, login, logout, reset, toast, toasts])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
export const useStore = () => { const c = useContext(StoreCtx); if (!c) throw new Error('StoreProvider ausente'); return c }

/** Dados pessoais ("Minha área") do usuário logado: Natan (colaborador) ou Luana (gestora). */
export const useMe = () => {
  const { db, update, toast } = useStore()
  const id = ANA
  const p = mineOf(db, id)
  const edit = (fn: (m: Personal, d: DB) => void) => update((d) => fn(mineOf(d, id), d))
  return { db, p, id, edit, update, toast, isGestora: id !== ANA, name: p.self.name, first: p.self.name.split(' ')[0] }
}
