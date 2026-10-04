import { useEffect, useRef, useState } from 'react';
import { CalendarHeart, Compass, MessageCircle, Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppProvider';
import { Avatar } from './Avatar';
import { DiscoverFeed } from './DiscoverFeed';
import { CreateActivity } from './CreateActivity';
import { MyActivities } from './MyActivities';
import { ProfileModal } from './ProfileModal';
import { photoUrlFrom } from '../lib/helpers';
import { ChatModal } from './ChatWindow';
import { Chats } from './Chats';
import { NotificationCenter } from './NotificationCenter';

export function AppShell() {
  const { currentUser, openProfile, logout, activeChatActivityId, closeChat, activities } = useApp();
  const [view, setView] = useState('discover');
  const [editing, setEditing] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [activityFocus, setActivityFocus] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const goCreate = () => {
    closeChat();
    setEditing(null);
    setCreateOpen(true);
  };

  const goEdit = (activity) => {
    closeChat();
    setEditing(activity);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setEditing(null);
  };

  const finishCreate = () => {
    const wasEditing = Boolean(editing);
    closeCreate();
    setView(wasEditing ? 'mine' : 'discover');
  };

  const goToView = (nextView) => {
    closeChat();
    setProfileOpen(false);
    setView(nextView);
  };

  const openRelatedActivity = (activityId) => {
    const activity = activities.find((item) => item.id === activityId);
    closeChat();
    if (!activity) {
      setActivityFocus({ id: activityId, section: null });
      setView('discover');
      return;
    }
    if (activity.hostId === currentUser.id) {
      setActivityFocus({ id: activityId, section: 'created' });
      setView('mine');
      return;
    }
    if (activity.myApplicationStatus === 'accepted') {
      setActivityFocus({ id: activityId, section: 'joined' });
      setView('mine');
      return;
    }
    if (activity.myApplicationStatus === 'pending') {
      setActivityFocus({ id: activityId, section: 'pending' });
      setView('mine');
      return;
    }
    setActivityFocus({ id: activityId, section: null });
    setView('discover');
  };

  useEffect(() => {
    if (!profileOpen) return undefined;
    const onPointerDown = (event) => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [profileOpen]);

  useEffect(() => {
    if (!createOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeCreate();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [createOpen]);

  const navItems = [
    { id: 'discover', label: 'Discover', short: 'Discover', icon: Compass },
    { id: 'mine', label: 'My Activities', short: 'Activities', icon: CalendarHeart },
    { id: 'chats', label: 'Chat', short: 'Chat', icon: MessageCircle },
  ];

  return (
    <div className="min-h-dvh bg-background pb-20 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => goToView('discover')}
            className="flex items-center gap-2 focus-visible:outline-none sm:gap-3"
          >
            <span className="text-sm font-bold tracking-tight text-primary sm:text-base">CMU</span>
            <span className="border-l-2 border-border pl-2 text-base font-semibold text-foreground sm:pl-3 sm:text-lg">
              Activity Match
            </span>
          </button>

          <nav className="col-start-2 hidden items-center gap-1 lg:flex lg:gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goToView(item.id)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  view === item.id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="col-start-3 flex items-center justify-self-end gap-3 sm:gap-4">
            <NotificationCenter onOpenActivity={openRelatedActivity} />
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                className={cn(
                  'rounded-full border-2 border-transparent focus-visible:outline-none',
                  profileOpen && 'border-primary'
                )}
              >
                <Avatar
                  name={currentUser.display_name || currentUser.name}
                  photoUrl={photoUrlFrom(currentUser.profile_image)}
                  size={36}
                />
              </button>
              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-border bg-card py-2 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      openProfile(currentUser.id);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    Your profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="block w-full px-4 py-2 text-left text-sm font-bold text-primary hover:bg-cmu-soft"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        {view === 'discover' && (
          <DiscoverFeed
            onCreate={goCreate}
            focusActivityId={activityFocus?.section == null ? activityFocus?.id : null}
          />
        )}
        {view === 'mine' && (
          <MyActivities
            onCreate={goCreate}
            onEdit={goEdit}
            focusActivityId={activityFocus?.section ? activityFocus.id : null}
            focusSection={activityFocus?.section || null}
          />
        )}
        {view === 'chats' && <Chats />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card lg:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => (
            <BottomTab
              key={item.id}
              active={view === item.id}
              label={item.short}
              icon={item.icon}
              onClick={() => goToView(item.id)}
            />
          ))}
        </div>
      </nav>

      {!createOpen && (
        <button
          type="button"
          onClick={goCreate}
          aria-label="Create activity"
          className="fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:bg-cmu-dark focus-visible:outline-none lg:right-8 lg:bottom-8"
        >
          <Plus className="size-6" strokeWidth={2} />
        </button>
      )}

      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          onClick={closeCreate}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-activity-title"
            className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 id="create-activity-title" className="text-xl font-bold text-foreground">
                {editing ? 'Edit activity' : 'Create new activity'}
              </h2>
              <button
                type="button"
                onClick={closeCreate}
                aria-label="Close"
                className="rounded-full p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-6" strokeWidth={2} />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">
              <CreateActivity editing={editing} onDone={finishCreate} onCancel={closeCreate} />
            </div>
          </div>
        </div>
      )}

      <ProfileModal />
      {activeChatActivityId !== null && view !== 'chats' && (
        <ChatModal activityId={activeChatActivityId} onClose={closeChat} />
      )}
    </div>
  );
}

function BottomTab({ active, label, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-full w-full flex-col items-center justify-center gap-0.5 text-xs font-bold transition-colors',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <Icon className="size-5" strokeWidth={2} />
      {label}
    </button>
  );
}
