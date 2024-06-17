import axios from 'axios';
import React, { useState } from 'react';
import Loader from './Loader';

const GenerateAns = () => {
    const [messages, setMessages] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    const generateResponse = async () => {
        if (prompt.trim() === "") return;

        const userMessage = { sender: "user", text: prompt, timestamp: new Date().toISOString() };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setPrompt("");

        setLoading(true);

        try {
            const response = await axios({
                url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + import.meta.env.VITE_APP_API_KEY,
                method: "post",
                data: { "contents": [{ "parts": [{ "text": prompt }] }] },
            });
            const botMessage = {
                sender: "bot",
                text: response.data.candidates[0].content.parts[0].text,
                timestamp: new Date().toISOString(),
            };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (error) {
            console.error("Error generating response:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center p-5">
            <div className="flex flex-col bg-white dark:bg-gray-800 shadow-lg rounded-lg w-full max-w-4xl h-full">
                <div className="flex-grow overflow-auto p-4 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
                    {messages.map((msg, index) => (
                        <div key={index} className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs w-fit p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-200'}`}>
                                <div className="text-sm">{msg.text}</div>
                                <div className="text-xs text-right mt-1 text-gray-200 dark:text-gray-400">
                                    {formatTimestamp(msg.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && <div className="flex justify-center"><Loader /></div>}
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        generateResponse();
                    }}
                    className="flex items-center p-3 border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-b-lg"
                >
                    <textarea
                        id="chat"
                        rows="1"
                        className="flex-grow mx-4 p-2.5 w-full text-sm text-gray-900 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 resize-none"
                        placeholder="Type your message..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600"
                    >
                        <svg
                            className="w-5 h-5 rotate-90 rtl:-rotate-90"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 18 20"
                        >
                            <path d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z" />
                        </svg>
                        <span className="sr-only">Send message</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GenerateAns;
