# Project Timer VS Code Extension

## Overview

The **Project Timer VS Code Extension** helps developers track the time spent on specific projects. Each project's timer is stored locally and persists across sessions. It is ideal for managing productivity and monitoring time allocation for various projects.

---

## Features

- **Project-Specific Timer**: Tracks time spent on individual projects, stored locally in `.vscode/timer-data.json`.
- **Prompt on Open**: Automatically asks users to create a timer if none exists when a project is opened.
- **Persistent Storage**: Timer data is saved in the `.vscode` folder, ensuring it is specific to each project.

---

## Commands

| Command                     | Description                                             | Usage                                |
|-----------------------------|---------------------------------------------------------|--------------------------------------|
| `Save Project Data` | Saves the current timer data to `.vscode/timer-data.json`. | Run to persist timer updates.        |
| `Load Project Data` | Loads the current project's timer data.                | Displays saved timer data in VS Code. |
| `Development Time`  | Prompts the user to create a timer if none exists.      | Automatically runs on project open.  |

---

## How It Works

1. **Activation**:
   - The extension activates when VS Code starts or when a folder or workspace containing a `.vscode` directory is opened.

2. **Timer Initialization**:
   - On activation, the extension checks for a `timer-data.json` file in `.vscode`.
   - If no data is found, the user is prompted to create a timer.

3. **Persistent Storage**:
   - The timer data is stored in a project-specific JSON file located at 
   ` .vscode/timer-data.json `.

4. **File Structure**:
   - Timer data is stored in JSON format. Example:
     
   ```json
   {
   "totalTime": 5143.440999999997,
   "otherTime": 757.906,
   "lastUpdated": 1733042114292
   }
   ```

5. **User Prompts**:
   - If no timer exists, the extension prompts the user with:
     > *"No timer data found for this project. Do you want to create a timer?"*

6. **Updates**:
   - Now , it stores time of project to code, tesing and resources. The extension automatically saves the time data to the JSON file.
---

## Installation

### I've published on the vs code marketplace, you can use it. Here is the link:

[Try "Dev.time" Extension ](https://marketplace.visualstudio.com/items?itemName=vinay-dev.dev-time)