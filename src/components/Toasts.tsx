import { CheckCircle2 } from 'lucide-react'
import { useStore } from '../lib/store'
export default function Toasts() {
  const { toasts } = useStore()
  return <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className="toast ok"><CheckCircle2 size={18} />{t.msg}</div>)}</div>
}
