'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Square, Plus, Flag, Clock, Trash2, Circle, X, Save } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useSellerStore, type Task } from '@/stores/seller.store'
import { useAuthStore } from '@/stores/auth.store'
import toast from 'react-hot-toast'

type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  HIGH: { label: 'High', color: 'text-red-400 bg-red-500/10' },
  MEDIUM: { label: 'Medium', color: 'text-amber-400 bg-amber-500/10' },
  LOW: { label: 'Low', color: 'text-slate-400 bg-slate-500/10' },
}

const STATUS_COLS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO', label: 'To Do', color: 'text-muted-foreground' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'text-brand-400' },
  { id: 'DONE', label: 'Done', color: 'text-emerald-400' },
]

function AddTaskModal({ onClose, onCreate }: { onClose: () => void; onCreate: (task: Omit<Task, 'id' | 'createdAt'>) => void }) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM' as Priority,
    status: 'TODO' as TaskStatus, assignee: 'Demo Seller',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    tags: [] as string[], tagInput: '',
  })

  const handleCreate = () => {
    if (!form.title.trim()) { toast.error('Task title is required'); return }
    const { tagInput, ...rest } = form
    onCreate(rest)
    onClose()
  }

  const addTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, f.tagInput.trim()], tagInput: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md gradient-border p-6 rounded-2xl" style={{ background: 'hsl(222 44% 8%)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold">New Task</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Title *</label>
            <Input placeholder="Task title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..."
              className="w-full h-20 px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                className="w-full bg-obsidian-900 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                <option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full bg-obsidian-900 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Tags</label>
            <div className="flex gap-2">
              <Input placeholder="Add tag..." value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addTag()} className="flex-1" />
              <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {form.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded bg-obsidian-800 text-muted-foreground flex items-center gap-1">
                    {tag}
                    <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))} className="hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="brand" className="flex-1 gap-2" onClick={handleCreate}><Save className="w-4 h-4" />Create Task</Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function SellerTasksPage() {
  const { tasks, updateTaskStatus, deleteTask, createTask } = useSellerStore()
  const { user } = useAuthStore()
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Priority>('ALL')
  const [showAdd, setShowAdd] = useState(false)

  const cycleStatus = (id: string, current: TaskStatus) => {
    const next: TaskStatus = current === 'DONE' ? 'TODO' : current === 'TODO' ? 'IN_PROGRESS' : 'DONE'
    updateTaskStatus(id, next)
  }

  const filtered = tasks.filter(t => priorityFilter === 'ALL' || t.priority === priorityFilter)

  return (
    <DashboardLayout role="SELLER" title="Tasks" subtitle="Manage your team tasks and follow-ups">
      <div className="flex gap-4 mb-6 flex-wrap">
        {[
          { label: 'To Do', value: tasks.filter(t => t.status === 'TODO').length, color: 'text-muted-foreground' },
          { label: 'In Progress', value: tasks.filter(t => t.status === 'IN_PROGRESS').length, color: 'text-brand-400' },
          { label: 'Completed', value: tasks.filter(t => t.status === 'DONE').length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 glass-card px-4 py-2.5">
            <span className={`text-xl font-display font-bold font-mono ${s.color}`}>{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl border border-border">
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
              <button key={p} onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${priorityFilter === p ? 'bg-obsidian-800 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {p.toLowerCase()}
              </button>
            ))}
          </div>
          <Button variant="brand" size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1.5" />Add Task</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {STATUS_COLS.map(col => {
          const colTasks = filtered.filter(t => t.status === col.id)
          return (
            <div key={col.id}>
              <div className="flex items-center gap-2 mb-4">
                <div className={cn('w-2 h-2 rounded-full', col.id === 'TODO' ? 'bg-slate-400' : col.id === 'IN_PROGRESS' ? 'bg-brand-400' : 'bg-emerald-400')} />
                <h3 className={`font-display font-semibold text-sm ${col.color}`}>{col.label}</h3>
                <span className="text-xs text-muted-foreground ml-auto font-mono">{colTasks.length}</span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                <AnimatePresence>
                  {colTasks.map((task, i) => (
                    <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                      className={cn('gradient-border p-4 cursor-pointer hover:bg-white/[0.02] transition-all group', task.status === 'DONE' && 'opacity-60')}
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => cycleStatus(task.id, task.status)} className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-brand-400 transition-colors">
                          {task.status === 'DONE' ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : task.status === 'IN_PROGRESS' ? <Circle className="w-4 h-4 text-brand-400" /> : <Square className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium leading-snug', task.status === 'DONE' && 'line-through text-muted-foreground')}>{task.title}</p>
                          {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${PRIORITY_CONFIG[task.priority].color}`}>
                              <Flag className="w-2.5 h-2.5 inline mr-1" />{PRIORITY_CONFIG[task.priority].label}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {task.tags.map(tag => (
                              <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-obsidian-800 text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => { deleteTask(task.id); toast.success('Task deleted') }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {colTasks.length === 0 && (
                  <div className="border border-dashed border-border rounded-xl p-6 text-center">
                    <p className="text-xs text-muted-foreground">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onCreate={(task) => { createTask(user?.id ?? '', task); toast.success('Task created') }} />}
      </AnimatePresence>
    </DashboardLayout>
  )
}
