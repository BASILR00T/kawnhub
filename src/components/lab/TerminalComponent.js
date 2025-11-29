'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTerminal } from '@/hooks/useTerminal';
import { Terminal as TerminalIcon, Maximize2, Minimize2, RefreshCw, X, Minus, Square } from 'lucide-react';

export default function TerminalComponent({ onCommand, initialCommand }) {
    const { history, currentPath, executeCommand } = useTerminal();
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const hasExecutedInitial = useRef(false);

    // Execute initial command if provided
    useEffect(() => {
        if (initialCommand && !hasExecutedInitial.current) {
            hasExecutedInitial.current = true;
            // Small delay to simulate typing/loading
            setTimeout(() => {
                executeCommand(initialCommand);
                if (onCommand) onCommand(initialCommand);
            }, 500);
        }
    }, [initialCommand, executeCommand, onCommand]);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Focus input on click
    const handleContainerClick = () => {
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            executeCommand(input);
            if (onCommand) {
                onCommand(input);
            }
            setInput('');
        }
    };

    return (
        <div
            className={`flex flex-col bg-[#1e1e1e] rounded-xl overflow-hidden border border-[#333] shadow-2xl transition-all duration-300 ${isMaximized ? 'fixed inset-4 z-50' : 'w-full h-[500px]'}`}
            onClick={handleContainerClick}
            dir="ltr"
        >
            {/* Terminal Header (Linux Style) */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2e3436] border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2 text-gray-300 text-xs font-mono select-none">
                    <TerminalIcon size={14} className="text-gray-400" />
                    <span className="font-bold">student@kawnhub-lab: ~/{currentPath.slice(1).join('/')}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); executeCommand('clear'); }}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Clear Terminal"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <div className="h-4 w-px bg-gray-600/50 mx-1"></div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Minimize"
                    >
                        <Minus size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Maximize"
                    >
                        <Square size={12} />
                    </button>
                    <button
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto custom-scrollbar text-gray-300" style={{ fontFamily: '"Fira Code", "JetBrains Mono", monospace' }}>
                {history.map((line, index) => (
                    <div key={index} className="mb-1 break-words">
                        {line.type === 'command' ? (
                            <div className="flex gap-2 text-white">
                                <span className="text-green-400 font-bold">student@kawnhub:</span>
                                <span className="text-blue-400 font-bold">~{line.path}</span>
                                <span className="text-gray-400">$</span>
                                <span>{line.content}</span>
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap text-gray-300 ml-2">{line.content}</div>
                        )}
                    </div>
                ))}

                {/* Input Line */}
                <div className="flex gap-2 mt-2">
                    <span className="text-green-400 font-bold">student@kawnhub:</span>
                    <span className="text-blue-400 font-bold">~/{currentPath.slice(1).join('/')}</span>
                    <span className="text-gray-400">$</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-white caret-white"
                        autoFocus
                        autoComplete="off"
                        spellCheck="false"
                    />
                </div>
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
