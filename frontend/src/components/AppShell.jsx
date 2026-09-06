import { useState } from 'react';
import { CalendarHeart, Compass, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppProvider';
import { Avatar } from './Avatar';
import { DiscoverFeed } from './DiscoverFeed';
import { CreateActivity } from './CreateActivity';
import { MyActivities } from './MyActivities';
import { ProfileModal } from './ProfileModal';
import { photoUrlFrom } from '../lib/helpers';

export function AppShell() {
  const { currentUser, openProfile, logout } = useApp();
  const [view, setView] = useState('discover');
  const [editing, setEditing] = useState(null);

  const goCreate = () => {
    setEditing(null);
    setView('create');
  };

  const goEdit = (activity) => {
    setEditing(activity);
    setView('create');
  };

  const navItems = [
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'mine', label: 'My activities', icon: CalendarHeart },
  ];

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <button type="button" onClick={() => setView('discover')} className="flex items-center gap-2 focus-visible:outline-none">
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-primary font-serif text-base font-bold text-primary-foreground">
              M
            </span>
            <span className="font-serif text-lg font-semibold tracking-tight">Activity Match</span>
          </button>

          <div className="flex items-center gap-2">
            <nav className="mr-1 hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                    view === item.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <item.icon className="size-4" strokeWidth={2} />
                  {item.label}
                </button>
              ))}
            </nav>
            <button
              type="button"
              onClick={goCreate}
              className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:translate-y-px sm:inline-flex"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Create
            </button>
            <button
              type="button"
              onClick={logout}
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Log out
            </button>
            <button
              type="button"
              onClick={() => openProfile(currentUser.id)}
              aria-label="View your profile"
              className="rounded-full ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Avatar name={currentUser.display_name || currentUser.name} photoUrl={photoUrlFrom(currentUser.profile_image)} size={36} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {view === 'discover' && <DiscoverFeed onCreate={goCreate} />}
        {view === 'mine' && <MyActivities onCreate={goCreate} onEdit={goEdit} />}
        {view === 'create' && (
          <CreateActivity editing={editing} onDone={() => setView(editing ? 'mine' : 'discover')} />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-1.5">
          <BottomTab active={view === 'discover'} label="Discover" icon={Compass} onClick={() => setView('discover')} />
          <button
            type="button"
            onClick={goCreate}
            aria-label="Create activity"
            className="inline-flex size-12 -translate-y-1 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-0"
          >
            <Plus className="size-5" strokeWidth={2.5} />
          </button>
          <BottomTab active={view === 'mine'} label="Mine" icon={CalendarHeart} onClick={() => setView('mine')} />
        </div>
      </nav>

      <ProfileModal />
    </div>
  );
}

function BottomTab({ active, label, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex w-20 flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <Icon className="size-5" strokeWidth={2} />
      {label}
    </button>
  );
}