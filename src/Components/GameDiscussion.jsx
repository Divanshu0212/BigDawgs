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
import { Button, TextField } from "@mui/material";
import React from 'react';

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
        <div className="p-6 rounded-xl bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 shadow-xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-emerald-400 flex items-center">
                Game Discussion
            </h2>

            {error && (
                <div className="p-4 mb-6 bg-red-900/50 border border-red-700 text-red-200 rounded-lg">
                    {error}
                </div>
            )}

            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                {messages.length === 0 ? (
                    <p className="text-gray-400 text-center py-8 italic">
                        No messages yet. Be the first to comment!
                    </p>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-emerald-600/50 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <strong className="text-emerald-400 font-medium">
                                    {msg.userName}
                                </strong>
                                {msg.timestamp && (
                                    <span className="text-xs text-gray-400">
                                        {msg.timestamp.toLocaleString()}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-300 leading-relaxed">{msg.text}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 space-y-4">
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Write a comment..."
                    disabled={isLoading || !auth.currentUser}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(17, 24, 39, 0.8)',
                            borderRadius: '0.75rem',
                            '& fieldset': {
                                borderColor: 'rgba(55, 65, 81, 0.5)',
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgb(52, 211, 153)',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'rgb(52, 211, 153)',
                            },
                        },
                        '& .MuiOutlinedInput-input': {
                            color: 'rgb(243, 244, 246)',
                        },
                        '& .MuiInputLabel-root': {
                            color: 'rgb(156, 163, 175)',
                        },
                    }}
                />
                <div className="flex justify-end">
                    <Button
                        variant="contained"
                        onClick={handleSendMessage}
                        disabled={isLoading || !auth.currentUser || !newMessage.trim()}
                        sx={{
                            backgroundColor: 'rgb(52, 211, 153)',
                            '&:hover': {
                                backgroundColor: 'rgb(16, 185, 129)',
                            },
                            '&:disabled': {
                                backgroundColor: 'rgba(55, 65, 81, 0.5)',
                            },
                            borderRadius: '0.5rem',
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            padding: '0.5rem 1.5rem',
                        }}
                    >
                        {isLoading ? "Sending..." : "Send"}
                    </Button>
                </div>
            </div>

            {!auth.currentUser && (
                <p className="mt-4 text-sm text-gray-400 text-center">
                    Please log in to join the discussion
                </p>
            )}
        </div>
    );
};

export default GameDiscussion;