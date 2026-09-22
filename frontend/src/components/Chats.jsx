import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppProvider';
import { ChatWindow } from './ChatWindow';

function formatRoomTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function Chats() {
  const { currentUser } = useApp();
  const [rooms, setRooms] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.getChatRooms(currentUser.id)
      .then((result) => {
        if (!cancelled) {
          setRooms(result);
          setSelectedActivityId((previous) => (
            result.some((room) => room.activity_id === previous) ? previous : null
          ));
          setError('');
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser.id]);

  const selectedRoom = rooms.find((room) => room.activity_id === selectedActivityId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl app-heading">Chats</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Keep up with the activities you joined.</p>
      </header>

      <div className="grid min-h-[min(680px,calc(100dvh-12rem))] overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <aside className="border-b border-border lg:border-b-0 lg:border-r" aria-label="Chat conversations">
          <div className="border-b border-border px-5 py-4">
            <h2 className="chat-section-label">Conversations</h2>
          </div>
          {loading ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Loading chats...</p>
          ) : error ? (
            <p className="px-5 py-6 text-sm text-destructive" role="alert">{error}</p>
          ) : rooms.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">You are not in any chats yet.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto lg:max-h-none">
              {rooms.map((room) => (
                <button
                  key={room.activity_id}
                  type="button"
                  onClick={() => setSelectedActivityId(room.activity_id)}
                  className={`flex w-full items-start gap-3 border-b border-border px-5 py-4 text-left transition-colors ${selectedActivityId === room.activity_id
                    ? 'bg-secondary/70'
                    : 'hover:bg-secondary/40'
                    }`}
                >
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageCircle className="size-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="chat-list-title truncate text-sm font-semibold">{room.activity_title}</span>
                      {room.last_message_created_at && (
                        <time className="shrink-0 text-[11px] text-muted-foreground">
                          {formatRoomTime(room.last_message_created_at)}
                        </time>
                      )}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {room.last_message_content
                        ? room.last_message_content.slice(0, 40)
                        : 'No messages yet'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="flex min-h-[32rem] min-w-0 flex-col" aria-label="Selected chat">
          {selectedRoom ? (
            <ChatWindow activityId={selectedRoom.activity_id} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-muted-foreground">
              <MessageCircle className="mb-3 size-8" strokeWidth={1.5} />
              <p className="text-sm">Select a conversation to view its messages.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}