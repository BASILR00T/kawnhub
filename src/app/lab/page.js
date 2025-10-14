'use client'; // This component needs to be interactive

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// --- Reusable Bento Card for the 'ls' command ---
const BentoCard = ({ icon, title, description }) => (
    <div className="flex flex-col justify-between rounded-xl border border-border-color bg-surface-dark p-6 backdrop-blur-xl transition-transform duration-300 ease-in-out hover:-translate-y-1">
        <div>
            <div className="mb-4 text-3xl text-text-secondary">{icon}</div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm text-text-secondary">{description}</p>
        </div>
    </div>
);

// --- The Main Lab Page Component ---
export default function LabPage() {
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState('');
    const terminalRef = useRef(null);

    const commands = {
        'help': 'Available commands:\n  <span class="text-primary-blue">help</span>     - Show this list of commands.\n  <span class="text-primary-blue">ls</span>       - List all available subjects.\n  <span class="text-primary-blue">whoami</span>   - Display user information.\n  <span class="text-primary-blue">clear</span>    - Clear the terminal screen.',
        'whoami': 'User: Student\nGoal: Mastering Tech Skills',
        'ls': (
            <div className="my-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <BentoCard icon="💻" title="PC Config" description="أوامر فحص النظام وإصلاح مشاكل ويندوز." />
                <BentoCard icon="🐧" title="NOS" description="إدارة المستخدمين والصلاحيات في Linux." />
                <BentoCard icon="🌐" title="Network 2" description="بروتوكولات التوجيه وإعدادات السويتش." />
            </div>
        )
    };

    // Effect for the initial welcome message
    useEffect(() => {
        setHistory([
            { type: 'info', text: 'Initializing KawnHub v2.0 kernel...' },
            { type: 'success', text: 'System ready. Welcome, student.' },
            { type: 'info', text: "Type 'help' to see available commands." }
        ]);
    }, []);
    
    // Effect to scroll to the bottom on new output
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [history]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            const command = input.trim().toLowerCase();
            const newHistory = [...history, { type: 'command', text: command }];

            if (command === 'clear') {
                setHistory([]);
            } else if (commands[command]) {
                newHistory.push({ type: 'response', content: commands[command] });
                setHistory(newHistory);
            } else if (command) {
                newHistory.push({ type: 'error', text: `Command not found: ${command}` });
                setHistory(newHistory);
            } else {
                 setHistory(newHistory);
            }
            setInput('');
        }
    };

    return (
        <div 
            className="p-4 md:p-8 font-mono text-base bg-background-dark min-h-screen"
            onClick={() => document.getElementById('commandInput').focus()}
        >
            <div className="absolute top-4 left-4">
                <Link href="/" className="text-text-secondary hover:text-primary-blue transition-colors">
                    &larr; العودة للرئيسية
                </Link>
            </div>
            <div ref={terminalRef} className="h-full overflow-y-auto">
                {history.map((line, index) => (
                    <div key={index} className="mb-2 whitespace-pre-wrap">
                        {line.type === 'command' && (
                            <div>
                                <span className="text-primary-blue">KawnHub:~$</span>
                                <span className="ml-2">{line.text}</span>
                            </div>
                        )}
                        {line.type === 'response' && (
                            typeof line.content === 'string' 
                            ? <div dangerouslySetInnerHTML={{ __html: line.content }} />
                            : <div>{line.content}</div>
                        )}
                        {line.type === 'info' && <p className="text-text-secondary">{line.text}</p>}
                        {line.type === 'success' && <p className="text-green-400">{line.text}</p>}
                        {line.type === 'error' && <p className="text-red-500">{line.text}</p>}
                    </div>
                ))}
                <div className="flex items-center">
                    <span className="text-primary-blue">KawnHub:~$</span>
                    <input
                        id="commandInput"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-grow bg-transparent border-none text-text-primary focus:outline-none ml-2"
                        autoFocus
                    />
                </div>
            </div>
        </div>
    );
}