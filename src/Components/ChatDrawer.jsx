import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { FriendsContext } from "../Context/FriendsProvider.jsx";
import { getConversations, getMessages, sendMessage, markRead } from "../Services/chat.js";
import chatWs from "../Services/websocket.js";
import { FiSend, FiArrowLeft, FiMessageCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import "../Styles/ChatDrawer.css";

export default function ChatDrawer({ isOpen, onClose, onUnreadChange }) {
    const { friends } = useContext(FriendsContext);
    const navigate = useNavigate();

    // Views: "list" (conversation list) or "chat" (active conversation)
    const [view, setView] = useState("list");
    const [conversations, setConversations] = useState([]);
    const [activeFriend, setActiveFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);

    // Set of message IDs we've sent via REST (for dedup of sender echoes)
    const sentMessageIds = useRef(new Set());
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const currentUserId = parseInt(localStorage.getItem("current_user_id") || "0");

    // Fetch conversations when drawer opens
    useEffect(() => {
        if (isOpen && view === "list") {
            fetchConversations();
        }
    }, [isOpen, view]);

    // Connect/disconnect WebSocket based on drawer open state
    useEffect(() => {
        if (isOpen) {
            chatWs.connect();
        }
        return () => {
            // Don't disconnect on unmount — keep WS alive for notifications
        };
    }, [isOpen]);

    // Listen for incoming WebSocket messages
    useEffect(() => {
        const unsubscribe = chatWs.onMessage((data) => {
            // Dedup: if we sent this message via REST, skip the echo
            if (sentMessageIds.current.has(data.id)) {
                sentMessageIds.current.delete(data.id);
                return;
            }

            // If we're in the active chat with this sender, append the message
            if (activeFriend && (data.sender_id === activeFriend.id || data.sender_id === currentUserId)) {
                const convoId = makeConvoId(currentUserId, activeFriend.id);
                if (data.conversation_id === convoId) {
                    setMessages((prev) => {
                        // Extra safety: don't add if already exists
                        if (prev.some((m) => m.id === data.id)) return prev;
                        return [...prev, data];
                    });
                    // Auto-scroll to bottom
                    setTimeout(() => scrollToBottom(), 50);
                    // Mark as read since we're looking at it
                    markRead(activeFriend.id, data.id).catch(() => {});
                }
            }

            // Update conversation list (unread badges etc.)
            fetchConversations();
        });

        return unsubscribe;
    }, [activeFriend, currentUserId]);

    const makeConvoId = (a, b) => `${Math.min(a, b)}_${Math.max(a, b)}`;

    const fetchConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data);

            // Calculate total unread for badge
            const totalUnread = data.reduce((sum, c) => sum + (c.unread_count || 0), 0);
            if (onUnreadChange) onUnreadChange(totalUnread);
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        }
    };

    const openChat = async (friend) => {
        setActiveFriend(friend);
        setView("chat");
        setMessages([]);
        setHasMoreMessages(true);
        setIsLoadingMessages(true);

        try {
            const data = await getMessages(friend.id);
            // API returns newest first — reverse for chronological display
            setMessages(data.reverse());
            setHasMoreMessages(data.length === 20);

            // Mark last message as read
            if (data.length > 0) {
                const lastMsg = data[data.length - 1];
                markRead(friend.id, lastMsg.id).catch(() => {});
            }

            // Scroll to bottom after messages load
            setTimeout(() => scrollToBottom(), 100);
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const loadOlderMessages = async () => {
        if (isLoadingMore || !hasMoreMessages || messages.length === 0) return;
        setIsLoadingMore(true);

        const oldestId = messages[0]?.id;
        const container = messagesContainerRef.current;
        const prevScrollHeight = container?.scrollHeight || 0;

        try {
            const data = await getMessages(activeFriend.id, oldestId);
            // Reverse and prepend
            const older = data.reverse();
            setMessages((prev) => [...older, ...prev]);
            setHasMoreMessages(data.length === 20);

            // Maintain scroll position after prepending
            requestAnimationFrame(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight - prevScrollHeight;
                }
            });
        } catch (error) {
            console.error("Failed to load older messages:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleSend = async () => {
        const text = messageInput.trim();
        if (!text || isSending || !activeFriend) return;

        setIsSending(true);
        setMessageInput("");

        try {
            // REST returns the persisted message with its real DB id
            const msg = await sendMessage(activeFriend.id, text);

            // Track this ID so we skip the WS sender-echo
            sentMessageIds.current.add(msg.id);

            // Add to local state immediately if not already added by WS
            setMessages((prev) => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            setTimeout(() => scrollToBottom(), 50);

            // Refresh conversations list to update last message preview
            fetchConversations();
        } catch (error) {
            toast.error(`Could not send message: ${error.message}`);
            setMessageInput(text); // Restore input on failure
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (container && container.scrollTop === 0 && hasMoreMessages) {
            loadOlderMessages();
        }
    };

    const goBackToList = () => {
        setView("list");
        setActiveFriend(null);
        setMessages([]);
        fetchConversations(); // Refresh unread counts
    };

    // Build conversation list from API data
    const getConversationList = () => {
        const withMessages = [];
        const withoutMessages = [];

        for (const convo of conversations) {
            if (convo.last_message) {
                withMessages.push(convo);
            } else {
                withoutMessages.push(convo);
            }
        }

        // Sort conversations with messages by last message id (newest first)
        withMessages.sort((a, b) => {
            return (b.last_message?.id || 0) - (a.last_message?.id || 0);
        });

        return [...withMessages, ...withoutMessages];
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        // If the backend sends naive UTC, append 'Z' so the browser parses it correctly
        if (!dateStr.endsWith("Z") && !dateStr.includes("+") && !dateStr.includes("-", 10)) {
            dateStr += "Z";
        }
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "now";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    };

    if (!isOpen) return null;

    return (
        <div className="chat-drawer-overlay" onClick={onClose}>
            <div className="chat-drawer" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="chat-drawer-header">
                    {view === "chat" && (
                        <button className="chat-back-btn" onClick={goBackToList}>
                            <FiArrowLeft size={20} />
                        </button>
                    )}
                    <h2>{view === "list" ? "Messages" : activeFriend?.name || "Chat"}</h2>
                    <button className="chat-close-btn" onClick={onClose}>×</button>
                </div>

                {/* Conversation List View */}
                {view === "list" && (
                    <div className="chat-conversation-list">
                        {getConversationList().length === 0 && (
                            <div className="chat-empty-state">
                                <FiMessageCircle size={48} />
                                <p>No conversations yet</p>
                                <small>Add friends and start chatting!</small>
                            </div>
                        )}
                        {getConversationList().map((item) => (
                            <div
                                key={item.friend.id}
                                className={`chat-conversation-item ${item.unread_count > 0 ? "unread" : ""}`}
                                onClick={() => openChat(item.friend)}
                            >
                                <div className="chat-avatar">
                                    {item.friend.name ? [...item.friend.name][0].toUpperCase() : "U"}
                                </div>
                                <div className="chat-conversation-info">
                                    <div className="chat-conversation-name">
                                        <strong>{item.friend.name}</strong>
                                        {item.last_message && (
                                            <span className="chat-time">
                                                {formatTime(item.last_message.created_at)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="chat-last-message">
                                        {item.last_message
                                            ? item.last_message.post_id
                                                ? "📎 Shared a post"
                                                : item.last_message.content?.substring(0, 40) + (item.last_message.content?.length > 40 ? "..." : "")
                                            : "Start a conversation"
                                        }
                                    </p>
                                </div>
                                {item.unread_count > 0 && (
                                    <div className="chat-unread-badge">{item.unread_count}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Active Chat View */}
                {view === "chat" && (
                    <>
                        <div
                            className="chat-messages"
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                        >
                            {isLoadingMore && (
                                <div className="chat-loading-more">Loading older messages...</div>
                            )}
                            {!hasMoreMessages && messages.length > 0 && (
                                <div className="chat-start-of-convo">Beginning of conversation</div>
                            )}
                            {isLoadingMessages && (
                                <div className="chat-loading">Loading messages...</div>
                            )}
                            {!isLoadingMessages && messages.length === 0 && (
                                <div className="chat-empty-chat">
                                    <p>No messages yet. Say hi! 👋</p>
                                </div>
                            )}
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`chat-message ${msg.sender_id === currentUserId ? "sent" : "received"}`}
                                >
                                    {msg.post_id && msg.post ? (
                                        <div
                                            className="chat-shared-post"
                                            onClick={() => {
                                                navigate(`/feed#post-${msg.post.id}`);
                                                onClose();
                                            }}
                                        >
                                            <span className="chat-shared-label">📎 Shared Post</span>
                                            <strong>{msg.post.title}</strong>
                                            <small>Tap to view →</small>
                                        </div>
                                    ) : (
                                        <p>{msg.content}</p>
                                    )}
                                    <span className="chat-msg-time">{formatTime(msg.created_at)}</span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="chat-input-container">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isSending}
                            />
                            <button
                                className="chat-send-btn"
                                onClick={handleSend}
                                disabled={isSending || !messageInput.trim()}
                            >
                                <FiSend size={18} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
