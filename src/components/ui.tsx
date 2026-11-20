import { useState, type ReactNode, type ButtonHTMLAttributes, type CSSProperties } from 'react'
import { X } from 'lucide-react'
import { initials } from '../lib/format'
import type { Level } from '../lib/types'
import { LEVELS } from '../lib/selectors'

export const Pill = ({ tone = '', children, style }: { tone?: string; children: ReactNode; style?: CSSProperties }) => <span className={`pill ${tone}`} style={style}>{children}</span>

export const Btn = ({ kind = 'primary', small, className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'primary' | 'outline' | 'ghost' | 'danger'; small?: boolean }) =>
  <button {...p} className={`btn ${kind} ${small ? 'sm' : ''} ${className}`} />

export const LinkBtn = ({ danger, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) => <button {...p} className={`link ${danger ? 'danger' : ''} ${p.className ?? ''}`} />

export const Card = ({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) => <div className={`card ${className}`} style={style}>{children}</div>

export const CardHead = ({ title, right }: { title: ReactNode; right?: ReactNode }) => <div className="card-head"><h2>{title}</h2>{right}</div>

export const Progress = ({ value, tone = '' }: { value: number; tone?: string }) => <div className={`progress ${tone}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>

export const Avatar = ({ name, size = 34, tone = 'soft' }: { name: string; size?: number; tone?: string }) =>
  <span className={`avatar ${tone}`} style={{ width: size, height: size, fontSize: size * 0.34 }}>{initials(name)}</span>

export const Person = ({ name, sub }: { name: string; sub?: string }) => <div className="person"><Avatar name={name} /><div><b>{name}</b>{sub && <small>{sub}</small>}</div></div>

export const Toggle = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) =>
  <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />

export function Tabs<T extends string>({ items, value, onChange }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return <div className="tabs" role="tablist">{items.map((i) => <button key={i.id} role="tab" aria-selected={value === i.id} className={value === i.id ? 'on' : ''} onClick={() => onChange(i.id)}>{i.label}</button>)}</div>
}

export function Select({ value, onChange, options, auto, label, ...rest }: { value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[]; auto?: boolean; label?: string }) {
  return (
    <select aria-label={label} className={`select ${auto ? 'auto' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {options.map((o) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) =>
  <div className={`field ${error ? 'error' : ''}`}><label>{label}</label>{children}{error && <div className="err">{error}</div>}</div>

export function Modal({ title, sub, onClose, children, actions, wide }: { title: string; sub?: string; onClose: () => void; children: ReactNode; actions?: ReactNode; wide?: boolean }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label={title} style={wide ? { maxWidth: 680 } : undefined}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div><h3>{title}</h3>{sub && <p className="muted sm">{sub}</p>}</div>
          <button className="link" aria-label="Fechar" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="body">{children}</div>
        {actions && <div className="btn-row">{actions}</div>}
      </div>
    </div>
  )
}

export function Scale({ value, onChange, n = 5, disabled }: { value: number; onChange?: (v: number) => void; n?: number; disabled?: boolean }) {
  return <div className="scale">{Array.from({ length: n }, (_, i) => i + 1).map((v) => <button key={v} type="button" disabled={disabled} className={value === v ? 'on' : ''} onClick={() => onChange?.(v)}>{v}</button>)}</div>
}

export function LevelPicker({ value, onChange, disabled }: { value?: Level; onChange?: (l: Level) => void; disabled?: boolean }) {
  return <div className="levels">{LEVELS.map((l) => <button key={l.id} type="button" disabled={disabled} className={value === l.id ? 'on' : ''} onClick={() => onChange?.(l.id)}>{l.label}</button>)}</div>
}

export function Stepper({ steps }: { steps: { title: string; sub: string; state: 'done' | 'now' | 'todo' }[] }) {
  return (
    <Card className="stepper">
      {steps.map((s, i) => (
        <div key={s.title} style={{ display: 'contents' }}>
          <div className={`step ${s.state}`}>
            <span className="num">{s.state === 'done' ? '✓' : i + 1}</span>
            <div><b>{s.title}</b><small>{s.sub}</small></div>
          </div>
          {i < steps.length - 1 && <div className={`step-line ${s.state === 'done' ? 'done' : ''}`} />}
        </div>
      ))}
    </Card>
  )
}

export function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  return (
    <div className="pager">
      <button disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Anterior">‹</button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => <button key={p} className={p === page ? 'on' : ''} onClick={() => onChange(p)}>{p}</button>)}
      <button disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Próxima">›</button>
    </div>
  )
}

export function useTab<T extends string>(initial: T) { return useState<T>(initial) }

export const Kpi = ({ label, value, unit, foot, bar, tone = '', valueColor }: { label: string; value: ReactNode; unit?: ReactNode; foot?: ReactNode; bar?: number; tone?: string; valueColor?: string }) => (
  <Card className="kpi">
    <div className="label">{label}</div>
    <div className="val"><b style={valueColor ? { color: valueColor } : undefined}>{value}</b>{unit && <span>{unit}</span>}</div>
    {bar !== undefined && <Progress value={bar} tone={tone} />}
    {foot && <div className="foot">{foot}</div>}
  </Card>
)
