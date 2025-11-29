# 🤖 Interactive Lab Features Prompts

Use these prompts to guide the implementation of the new Interactive Lab features.

---

## 🐍 Feature 1: Python Execution (Client-side)
**Context:** We have an in-memory file system in `useTerminal.js`. We want to execute Python code stored in these virtual files.
**Prompt:**
> "Integrate `Pyodide` into the `useTerminal` hook to enable client-side Python execution.
> 1.  Add a new command `python [filename]`.
> 2.  When executed, read the content of `[filename]` from the `fileSystem` state.
> 3.  Initialize Pyodide (loading it from CDN) if not already loaded.
> 4.  Pass the file content to `pyodide.runPythonAsync()`.
> 5.  Capture the standard output (stdout) and display it in the terminal history.
> 6.  Handle errors (syntax errors, runtime errors) gracefully and show them in red."

---

## 🌐 Feature 2: Networking Simulation (Ping & IP)
**Context:** We need to simulate basic networking commands without real network requests.
**Prompt:**
> "Implement a `ping` command simulator in `useTerminal.js`.
> 1.  Define a `networkMap` object in the state, mapping hostnames (e.g., 'google.com', 'pc-2') to IP addresses (e.g., '8.8.8.8', '192.168.1.5').
> 2.  Add a `ping [target]` command.
> 3.  Logic:
>     *   Resolve `[target]` to an IP using `networkMap`.
>     *   If resolved, simulate 4 packets:
>         *   Show 'Reply from [IP]: bytes=32 time=XXms' with a small random delay (using `setTimeout`).
>         *   Calculate packet loss statistics at the end.
>     *   If not resolved, show 'Ping request could not find host [target]'.
> 4.  (Optional) Add `ipconfig` to show the current user's fake IP."

---

## 🤝 Feature 3: Real-time Collaboration (Live Sync)
**Context:** Enable two students to see the same terminal state.
**Prompt:**
> "Upgrade `useTerminal` to support real-time synchronization using Firebase Firestore.
> 1.  Create a Firestore collection `labs`.
> 2.  When a user opens the lab, create/join a session ID.
> 3.  Sync the `fileSystem` and `history` states with the Firestore document.
> 4.  Use `onSnapshot` to listen for changes:
>     *   If User A runs `mkdir test`, update Firestore.
>     *   User B's terminal should automatically reflect the new folder and the command in history.
> 5.  Add a 'typing indicator' to show when the other user is typing a command."
