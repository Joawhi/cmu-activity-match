import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LoaderCircle, Send, X } from 'lucide-react';
import { api } from '../api';
import { formatMessageTime } from '../lib/helpers';
import { useApp } from '../context/AppProvider';

export function ChatWindow({ activityId }) {
    const { activities, currentUser, closeChat } = useApp();
    const activity = activities.find((item) => item.id === Number(activityId));
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingEarlier, setLoadingEarlier] = useState(false);
    const [hasEarlier, setHasEarlier] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesContainerRef = useRef(null);
    const lastMessageIdRef = useRef(0);
    const oldestMessageIdRef = useRef(null);
    const scrollToBottomRef = useRef(false);
    const scrollAdjustmentRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        let polling = false;

        const loadMessages = async (initial = false) => {
            if (polling) return;
            polling = true;
            try {
                const result = await api.getChatMessages(
                    activityId,
                    currentUser.id,
                    initial ? {} : { afterId: lastMessageIdRef.current }
                );
                const rows = result.messages;
                if (cancelled) return;
                if (rows.length > 0) {
                    if (initial) {
                        oldestMessageIdRef.current = rows[0].id;
                        setHasEarlier(result.hasEarlier);
                    }
                    lastMessageIdRef.current = rows[rows.length - 1].id;
                    setMessages((previous) => initial ? rows : [...previous, ...rows]);
                    scrollToBottomRef.current = true;
                }
                setError('');
            } catch (requestError) {
                if (!cancelled && initial) setError(requestError.message);
            } finally {
                polling = false;
                if (!cancelled) setLoading(false);
            }
        };

        loadMessages(true);
        const intervalId = window.setInterval(() => loadMessages(), 4000);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [activityId, currentUser.id]);

    useLayoutEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        if (scrollAdjustmentRef.current) {
            const { top, height } = scrollAdjustmentRef.current;
            container.scrollTop = top + (container.scrollHeight - height);
            scrollAdjustmentRef.current = null;
        } else if (scrollToBottomRef.current) {
            container.scrollTop = container.scrollHeight;
            scrollToBottomRef.current = false;
        }
    }, [messages]);

    const loadEarlierMessages = async () => {
        if (loadingEarlier || oldestMessageIdRef.current === null) return;

        const container = messagesContainerRef.current;
        const previousHeight = container?.scrollHeight || 0;
        const previousTop = container?.scrollTop || 0;
        setLoadingEarlier(true);
        setError('');
        try {
            const result = await api.getChatMessages(activityId, currentUser.id, {
                beforeId: oldestMessageIdRef.current,
            });
            if (result.messages.length === 0) {
                setHasEarlier(false);
                return;
            }

            oldestMessageIdRef.current = result.messages[0].id;
            setHasEarlier(result.hasEarlier);
            scrollAdjustmentRef.current = { top: previousTop, height: previousHeight };
            setMessages((previous) => [...result.messages, ...previous]);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoadingEarlier(false);
        }
    };

    const sendMessage = async (event) => {
        event.preventDefault();
        const trimmed = content.trim();
        if (!trimmed) {
            setError('Message cannot be empty.');
            return;
        }
        if (trimmed.length > 500) {
            setError('Messages can be up to 500 characters.');
            return;
        }

        setSending(true);
        setError('');
        try {
            const message = await api.sendChatMessage(activityId, currentUser.id, trimmed);
            setMessages((previous) => [...previous, message]);
            lastMessageIdRef.current = message.id;
            setContent('');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 sm:items-center sm:p-4" role="presentation">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="chat-window-title"
                className="flex h-[min(720px,90dvh)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl sm:h-[min(720px,85dvh)] sm:rounded-2xl"
            >
                <header className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Activity chat</p>
                        <h2 id="chat-window-title" className="truncate font-serif text-xl font-semibold text-foreground">
                            {activity?.title || 'Chat'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={closeChat}
                        aria-label="Close chat"
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                        <X className="size-5" strokeWidth={2} />
                    </button>
                </header>

                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            <LoaderCircle className="size-5 animate-spin" aria-label="Loading messages" />
                        </div>
                    ) : messages.length === 0 ? (
                        <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No messages yet. Start the conversation.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {(hasEarlier || loadingEarlier) && (
                                <div className="flex justify-center pb-2">
                                    <button
                                        type="button"
                                        onClick={loadEarlierMessages}
                                        disabled={loadingEarlier}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-wait disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                                    >
                                        {loadingEarlier && <LoaderCircle className="size-3.5 animate-spin" />}
                                        {loadingEarlier ? 'Loading earlier messages...' : 'Load earlier messages'}
                                    </button>
                                </div>
                            )}
                            {messages.map((message, index) => {
                                const ownMessage = message.sender_id === currentUser.id;
                                const previous = messages[index - 1];
                                const grouped = previous?.sender_id === message.sender_id;
                                return (
                                    <div key={message.id} className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[82%] ${ownMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                                            {!grouped && (
                                                <span className="mb-1 px-1 text-xs font-semibold text-muted-foreground">
                                                    {ownMessage ? 'You' : message.sender_name}
                                                </span>
                                            )}
                                            <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${ownMessage
                                                ? 'rounded-br-md bg-primary text-primary-foreground'
                                                : 'rounded-bl-md bg-secondary text-secondary-foreground'
                                                }`}>
                                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                                <time className={`mt-1 block text-[11px] ${ownMessage ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>
                                                    {formatMessageTime(message.created_at)}
                                                </time>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <form onSubmit={sendMessage} className="border-t border-border px-4 py-3 sm:px-6">
                    {error && <p className="mb-2 text-xs text-destructive" role="alert">{error}</p>}
                    <div className="flex items-end gap-2">
                        <textarea
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            maxLength={500}
                            rows={2}
                            placeholder="Write a message..."
                            aria-label="Message"
                            className="min-h-11 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                        />
                        <button
                            type="submit"
                            disabled={sending || !content.trim()}
                            aria-label="Send message"
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                            {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" strokeWidth={2.25} />}
                        </button>
                    </div>
                    <p className="mt-1.5 text-right text-[11px] text-muted-foreground">{content.length}/500</p>
                </form>
            </div>
        </div>
    );
}