'use client';

import { useState, useCallback } from 'react';

const initialFileSystem = {
    "home": {
        type: "dir",
        children: {
            "student": {
                type: "dir",
                children: {
                    "welcome.txt": { type: "file", content: "Welcome to KawnHub Lab!\nThis is a simulated Linux environment.\nTry commands like 'ls', 'cd', 'mkdir', and 'touch'." },
                    "projects": { type: "dir", children: {} }
                }
            }
        }
    },
    "etc": {
        type: "dir",
        children: {
            "passwd": { type: "file", content: "root:x:0:0:root:/root:/bin/bash\nstudent:x:1000:1000:student:/home/student:/bin/bash" },
            "hostname": { type: "file", content: "kawnhub-lab" }
        }
    },
    "var": {
        type: "dir",
        children: {
            "log": { type: "dir", children: {} }
        }
    }
};

export const useTerminal = () => {
    const [history, setHistory] = useState([
        { type: 'output', content: 'Welcome to KawnHub Interactive Lab v1.0' },
        { type: 'output', content: 'Type "help" to see available commands.' },
    ]);
    const [currentPath, setCurrentPath] = useState(['home', 'student']);
    const [fileSystem, setFileSystem] = useState(initialFileSystem);

    // Helper: Resolve path to a directory object
    const resolvePath = (pathParts, fs) => {
        let current = fs;
        for (const part of pathParts) {
            if (current[part] && current[part].type === 'dir') {
                current = current[part].children;
            } else {
                return null;
            }
        }
        return current;
    };

    const addToHistory = (command, output) => {
        setHistory(prev => [
            ...prev,
            { type: 'command', content: command, path: '/' + currentPath.join('/') },
            ...(output ? [{ type: 'output', content: output }] : [])
        ]);
    };

    const executeCommand = useCallback((cmdString) => {
        const trimmedCmd = cmdString.trim();
        if (!trimmedCmd) return;

        const [cmd, ...args] = trimmedCmd.split(/\s+/);
        const currentDirObj = resolvePath(currentPath, fileSystem);

        switch (cmd) {
            case 'help':
                addToHistory(trimmedCmd,
                    'Available commands:\n' +
                    '  ls           List directory contents\n' +
                    '  cd [dir]     Change directory\n' +
                    '  pwd          Print working directory\n' +
                    '  mkdir [dir]  Create a directory\n' +
                    '  touch [file] Create an empty file\n' +
                    '  cat [file]   Display file contents\n' +
                    '  echo [text]  Print text\n' +
                    '  whoami       Print current user\n' +
                    '  clear        Clear terminal screen'
                );
                break;

            case 'clear':
                setHistory([]);
                break;

            case 'ls':
                if (!currentDirObj) {
                    addToHistory(trimmedCmd, 'Error: Current directory not found.');
                    return;
                }
                const items = Object.keys(currentDirObj).map(name => {
                    const isDir = currentDirObj[name].type === 'dir';
                    return isDir ? `${name}/` : name;
                });
                addToHistory(trimmedCmd, items.join('  '));
                break;

            case 'pwd':
                addToHistory(trimmedCmd, '/' + currentPath.join('/'));
                break;

            case 'whoami':
                addToHistory(trimmedCmd, 'student');
                break;

            case 'cd':
                const target = args[0];
                if (!target || target === '~') {
                    setCurrentPath(['home', 'student']);
                    addToHistory(trimmedCmd, '');
                    return;
                }
                if (target === '..') {
                    if (currentPath.length > 0) {
                        setCurrentPath(prev => prev.slice(0, -1));
                    }
                    addToHistory(trimmedCmd, '');
                    return;
                }
                if (target === '.') {
                    addToHistory(trimmedCmd, '');
                    return;
                }

                // Simple relative path support for now (one level)
                if (currentDirObj[target] && currentDirObj[target].type === 'dir') {
                    setCurrentPath(prev => [...prev, target]);
                    addToHistory(trimmedCmd, '');
                } else {
                    addToHistory(trimmedCmd, `cd: ${target}: No such file or directory`);
                }
                break;

            case 'mkdir':
                const newDirName = args[0];
                if (!newDirName) {
                    addToHistory(trimmedCmd, 'mkdir: missing operand');
                    return;
                }
                if (currentDirObj[newDirName]) {
                    addToHistory(trimmedCmd, `mkdir: cannot create directory '${newDirName}': File exists`);
                    return;
                }

                // Deep copy to update state
                const newFsMkdir = JSON.parse(JSON.stringify(fileSystem));
                const targetDirMkdir = resolvePath(currentPath, newFsMkdir);
                targetDirMkdir[newDirName] = { type: 'dir', children: {} };
                setFileSystem(newFsMkdir);
                addToHistory(trimmedCmd, '');
                break;

            case 'touch':
                const newFileName = args[0];
                if (!newFileName) {
                    addToHistory(trimmedCmd, 'touch: missing operand');
                    return;
                }
                if (currentDirObj[newFileName]) {
                    // Update timestamp logic could go here, for now just ignore
                    addToHistory(trimmedCmd, '');
                    return;
                }

                const newFsTouch = JSON.parse(JSON.stringify(fileSystem));
                const targetDirTouch = resolvePath(currentPath, newFsTouch);
                targetDirTouch[newFileName] = { type: 'file', content: '' };
                setFileSystem(newFsTouch);
                addToHistory(trimmedCmd, '');
                break;

            case 'cat':
                const catFile = args[0];
                if (!catFile) {
                    addToHistory(trimmedCmd, 'cat: missing operand');
                    return;
                }
                if (currentDirObj[catFile]) {
                    if (currentDirObj[catFile].type === 'dir') {
                        addToHistory(trimmedCmd, `cat: ${catFile}: Is a directory`);
                    } else {
                        addToHistory(trimmedCmd, currentDirObj[catFile].content || '');
                    }
                } else {
                    addToHistory(trimmedCmd, `cat: ${catFile}: No such file or directory`);
                }
                break;

            case 'echo':
                addToHistory(trimmedCmd, args.join(' '));
                break;

            default:
                addToHistory(trimmedCmd, `${cmd}: command not found`);
        }
    }, [currentPath, fileSystem]);

    return {
        history,
        currentPath,
        executeCommand
    };
};
