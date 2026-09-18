import { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
    const [activeChatActivityId, setActiveChatActivityId] = useState(null);

    const value = {
        activeChatActivityId,
        openChat: setActiveChatActivityId,
        closeChat: () => setActiveChatActivityId(null),
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within ChatProvider');
    return context;
}