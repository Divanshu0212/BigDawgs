import { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    where,
    serverTimestamp
} from "firebase/firestore";
import React from "react";
import { MessageCircle, Send, Loader } from "lucide-react";

const GameDiscussion = ({ gameId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!gameId) {
            setError("No game ID provided");
            return;
        }

        try {
            const q = query(
                collection(db, "game_messages"),
                where("gameId", "==", gameId),
                orderBy("timestamp", "asc")
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const messageData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate(),
                }));
                setMessages(messageData);
                setError(null);
            }, (err) => {
                console.error("Error fetching messages:", err);
                setError("Failed to load messages. Please try again later.");
            });

            return () => unsubscribe();
        } catch (err) {
            console.error("Error setting up message listener:", err);
            setError("Failed to initialize message loading");
        }
    }, [gameId]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const user = auth.currentUser;
        if (!user) {
            setError("You must be logged in to post a comment.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await addDoc(collection(db, "game_messages"), {
                gameId: gameId,
                text: newMessage.trim(),
                userId: user.uid,
                userName: user.displayName || "Anonymous",
                userEmail: user.email,
                timestamp: serverTimestamp(),
            });

            setNewMessage("");
        } catch (err) {
            console.error("Error sending message:", err);
            setError("Failed to send message. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
                <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                    <MessageCircle className="w-6 h-6" />
                    Game Discussion
                </h2>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mx-4 mt-4 p-4 bg-red-900/20 border border-red-900/50 text-red-300 rounded-lg">
                    {error}
                </div>
            )}

            {/* Messages Section */}
            <div className="p-4">
                <div className="space-y-4 h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800/50">
                    {messages.length === 0 ? (
                        <div className="text-zinc-400 text-center py-8 italic">
                            No messages yet. Be the first to comment!
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/30 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-emerald-400 font-medium">
                                        {msg.userName}
                                    </span>
                                    {msg.timestamp && (
                                        <span className="text-xs text-zinc-400">
                                            {msg.timestamp.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {msg.text}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Input Section */}
            <div className="p-4 border-t border-zinc-800">
                <div className="space-y-4">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Write a comment..."
                        disabled={isLoading || !auth.currentUser}
                        className="w-full min-h-[100px] p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg 
                                 text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none 
                                 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !auth.currentUser || !newMessage.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg
                                     hover:bg-emerald-600 transition-colors disabled:opacity-50 
                                     disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>Send</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {!auth.currentUser && (
                    <div className="mt-4 text-sm text-zinc-400 text-center">
                        Please log in to join the discussion
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameDiscussion;