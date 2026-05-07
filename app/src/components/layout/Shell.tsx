import { Outlet, NavLink } from 'react-router-dom'
import { LayoutGrid, Activity, Zap, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Shell() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] flex-shrink-0 bg-white border-r border-slate-100 flex flex-col">
        {/* Logo */}
        <div className="px-5 h-[60px] flex items-center border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
              <Zap size={13} className="text-white fill-white" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-slate-900 leading-none">CXology</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-none">Execution Platform</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3">
          <div className="mb-4">
            <div className="px-2 mb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Workspace</div>
            <NavLink
              to="/pipeline"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <LayoutGrid size={15} className={cn('flex-shrink-0', isActive ? 'text-brand-600' : 'text-slate-400')} />
                  <div>
                    <div className="text-[13px] font-medium leading-none">Pipeline</div>
                    <div className={cn('text-[10px] mt-0.5 leading-none', isActive ? 'text-brand-400' : 'text-slate-400')}>Progression by stage</div>
                  </div>
                </>
              )}
            </NavLink>
            <NavLink
              to="/inflection-points"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Activity size={15} className={cn('flex-shrink-0', isActive ? 'text-brand-600' : 'text-slate-400')} />
                  <div>
                    <div className="text-[13px] font-medium leading-none">Inflection Points</div>
                    <div className={cn('text-[10px] mt-0.5 leading-none', isActive ? 'text-brand-400' : 'text-slate-400')}>Execution quality</div>
                  </div>
                </>
              )}
            </NavLink>
            <NavLink
              to="/health"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Heart size={15} className={cn('flex-shrink-0', isActive ? 'text-brand-600' : 'text-slate-400')} />
                  <div>
                    <div className="text-[13px] font-medium leading-none">Health Scoring</div>
                    <div className={cn('text-[10px] mt-0.5 leading-none', isActive ? 'text-brand-400' : 'text-slate-400')}>Account health signals</div>
                  </div>
                </>
              )}
            </NavLink>
          </div>
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-semibold text-brand-700">SC</span>
            </div>
            <div>
              <div className="text-[12px] font-medium text-slate-700 leading-none">Sarah Chen</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Customer Success</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
