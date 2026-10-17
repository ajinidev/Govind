const TONES = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  solidRed: 'bg-red-600 text-white',
  indigo: 'bg-indigo-100 text-indigo-700',
};

export default function Badge({ tone = 'slate', children }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}

export const PRIORITY_TONE = { low: 'green', medium: 'blue', high: 'orange', urgent: 'red' };
export const STATUS_TONE = { todo: 'slate', in_progress: 'indigo', on_hold: 'orange', done: 'green' };
