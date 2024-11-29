# Project Timer VS Code Extension

## Overview

The **Project Timer VS Code Extension** helps developers track the time spent on specific projects. Each project's timer is stored locally and persists across sessions. It is ideal for managing productivity and monitoring time allocation for various projects.

---

## Features

- **Project-Specific Timer**: Tracks time spent on individual projects, stored locally in `.vscode/timer-data.json`.
- **Prompt on Open**: Automatically asks users to create a timer if none exists when a project is opened.
- **Persistent Storage**: Timer data is saved in the `.vscode` folder, ensuring it is specific to each project.
- **Commands**: Provides commands to save, load, and initialize project timers.

---

## Commands

| Command                     | Description                                             | Usage                                |
|-----------------------------|---------------------------------------------------------|--------------------------------------|
| `extension.saveProjectData` | Saves the current timer data to `.vscode/timer-data.json`. | Run to persist timer updates.        |
| `extension.loadProjectData` | Loads the current project's timer data.                | Displays saved timer data in VS Code. |
| `extension.promptForTimer`  | Prompts the user to create a timer if none exists.      | Automatically runs on project open.  |

---

## How It Works

1. **Activation**:
   - The extension activates when VS Code starts or when a folder or workspace containing a `.vscode` directory is opened.

2. **Timer Initialization**:
   - On activation, the extension checks for a `timer-data.json` file in `.vscode`.
   - If no data is found, the user is prompted to create a timer.

3. **Persistent Storage**:
   - The timer data is stored in a project-specific JSON file located at `.vscode/timer-data.json`.

4. **File Structure**:
   - Timer data is stored in JSON format. Example:
     ```json
     {
       "timer": 3600,
       "lastUpdated": "2024-11-28T12:00:00Z"
     }
     ```

5. **User Prompts**:
   - If no timer exists, the extension prompts the user with:
     > *"No timer data found for this project. Do you want to create a timer?"*

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/project-timer-vscode-extension.git
