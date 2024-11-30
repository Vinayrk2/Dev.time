const vscode = require("vscode")
const path = require("path")
const fs = require("fs")

function activate(context) {
    const tracker = new TimeTracker(context.workspaceState);

    // Register the Sidebar View
    const timerViewProvider = new TimerViewProvider(tracker);
    vscode.window.registerTreeDataProvider('projectTimerSidebar', timerViewProvider);

    // Commands for controlling the timer
    const showCommand = vscode.commands.registerCommand('project-time.showTimeSpent', () => tracker.showTimeSpent());

    context.subscriptions.push(showCommand);
    tracker.startTracking(timerViewProvider);
}

function deactivate() { }

// Class for managing project-specific timer data
class TimeTracker {
    constructor(workspaceState) {
        this.startTime = null;
        this.totalTime = 0;
        this.workspaceState = workspaceState;
        this.workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        this.dataFilePath = this.workspaceFolder
        ? path.join(this.workspaceFolder.uri.fsPath, '.vscode', 'timer-data.json')
        : null;
        this.checkAndPromptForTimer();
        this.loadProjectData();
        this.selection = true
    }

    startTracking(viewProvider) {
        vscode.window.onDidChangeWindowState((state) => {
            if (state.focused) {
                if (!this.startTime) this.startTime = Date.now();
            } else {
                this.updateTime();
                if (viewProvider) viewProvider.refresh(); // Update sidebar on focus loss
            }
        });

        vscode.workspace.onDidSaveTextDocument(() => {
            this.updateTime();
            if (viewProvider) viewProvider.refresh(); // Refresh sidebar
        });
    }


    updateTime() {
        if (this.startTime) {
            const elapsedTime = (Date.now() - this.startTime) / 1000;
            this.totalTime += elapsedTime;
            this.saveProjectData({ totalTime: this.totalTime, lastUpdated: Date.now() });
            this.startTime = null; // Reset the start time
        }
    }

    // showTimeSpent() {
    //     const time = {
    //         hours: Math.floor(this.totalTime / 3600),
    //         minutes: Math.floor((this.totalTime % 3600) / 60),
    //         seconds: Math.floor(this.totalTime % 60),
    //     };
    //     vscode.window.showInformationMessage(
    //         `Total time spent: ${time.hours.toString().padStart(2, '0')}:${time.minutes
    //             .toString()
    //             .padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`
    //     );
    // }

    loadProjectData() {
        if (!this.dataFilePath) {
            vscode.window.showErrorMessage('No workspace folder found!');
            return;
        }

        if (fs.existsSync(this.dataFilePath)) {
            const data = JSON.parse(fs.readFileSync(this.dataFilePath, 'utf8'));
            this.totalTime = data.totalTime || 0;
        } else {
            this.saveProjectData({ totalTime: 0, lastUpdated: Date.now() });
        }
    }

    saveProjectData(data) {
        if(!this.selection) return;
        if (!this.dataFilePath) return;
        this.ensureVSCodeFolder();
        fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2));
    }

    ensureVSCodeFolder() {
        if (this.workspaceFolder) {
            const vscodeDir = path.join(this.workspaceFolder.uri.fsPath, '.vscode');
            if (!fs.existsSync(vscodeDir)) fs.mkdirSync(vscodeDir);
        }
    }

    checkAndPromptForTimer() {
        if (!this.dataFilePath) return;
        if (!fs.existsSync(this.dataFilePath)) {
            vscode.window
                .showInformationMessage(
                    'No timer data found for this project. Do you want to create a timer?',
                    'Yes',
                    'No'
                )
                .then((selection) => {
                    if (selection === 'Yes') {
                        this.saveProjectData({ totalTime: 0, lastUpdated: Date.now() });
                        vscode.window.showInformationMessage('Timer initialized for this project!');
                    }
                    else{
                        this.selection = false
                    }
                });
        }
        this.startTime = Date.now()
    }
}

// Class for the Timer Sidebar View
class TimerViewProvider {
    constructor(tracker) {
        this.tracker = tracker;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren() {
        const time = this.tracker.totalTime || 0;
    
        // Convert time to hours, minutes, and seconds
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);
    
        // Format time as HH:MM:SS
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
        // Determine coder type based on time spent
        let coderType = "";
        const timeInMinutes = Math.floor(time / 60);
    
        if (timeInMinutes === 0) {
            coderType = "Not Started Yet";
        } else if (timeInMinutes <= 10) {
            coderType = "Just Getting Started";
        } else if (timeInMinutes <= 30) {
            coderType = "Warming Up!";
        } else if (timeInMinutes <= 45) {
            coderType = "Loving the Progress!";
        } else if (timeInMinutes <= 60) {
            coderType = "In the Zone!";
        } else if (timeInMinutes <= 75) {
            coderType = "Keep Crushing It!";
        } else if (timeInMinutes <= 90) {
            coderType = "Amazing Dedication!";
        } else {
            coderType = "Outstanding Effort!";
        }
    
        // Create a TreeItem for the time display
        const timeItem = new vscode.TreeItem(`⏱️ Time Spent: ${timeString}`);
        timeItem.description = ""; // Keep empty as it appears like a box
    
        // Create a TreeItem for the coder type
        const coderTypeItem = new vscode.TreeItem(`💡 Coder Type: ${coderType}`);
        coderTypeItem.description = ""; // Empty for consistent appearance
    
        // Create a separator line
        const separatorItem = new vscode.TreeItem("────────────────────────────");
        separatorItem.description = ""; // Purely visual item
        separatorItem.iconPath = new vscode.ThemeIcon("dash");
    
        // Create a note at the bottom
        const noteItem = new vscode.TreeItem(
            "Note: This time only tracks active coding in VS Code."
        );
        noteItem.description =
            "Testing, output observation, etc., are excluded for now.";
        noteItem.iconPath = new vscode.ThemeIcon("info");
    
        // Return all items in order to mimic the requested layout
        return [timeItem, coderTypeItem, separatorItem, noteItem];
    }
    

}

module.exports = {
    activate,
    deactivate,
};
