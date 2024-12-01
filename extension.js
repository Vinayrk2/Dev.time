const vscode = require("vscode")
const path = require("path")
const fs = require("fs")

let tracker = null;
function activate(context) {
    tracker = new TimeTracker(context.workspaceState);

    // Register the Sidebar View
    const timerViewProvider = new TimerViewProvider(tracker);
    vscode.window.registerTreeDataProvider('projectTimerSidebar', timerViewProvider);

    // Commands for controlling the timer
    const showCommand = vscode.commands.registerCommand('project-time.showTimeSpent', () => tracker.showTimeSpent());

    context.subscriptions.push(showCommand);
    tracker.startTracking(timerViewProvider);
}

function deactivate() { 
    tracker.updateTime()
}

// Class for managing project-specific timer data
class TimeTracker {
    constructor(workspaceState) {
        this.startTime = null;
        this.totalTime = 0;
        this.otherTime = 0;
        this.isInOtherMode = false;
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
                if (this.isInOtherMode) {
                    const elapsedOtherTime = (Date.now() - this.startTime) / 1000;
                    this.otherTime += elapsedOtherTime;
                    this.isInOtherMode = false;
                }
                this.startTime = Date.now();
            } else {
                this.updateTime();
                this.startTime = Date.now();
                this.isInOtherMode = true;
            }
            if (viewProvider) viewProvider.refresh();
        });

        vscode.workspace.onDidSaveTextDocument(() => {
            this.updateTime();
            if (viewProvider) viewProvider.refresh(); // Refresh sidebar
        });
    }


    updateTime() {
        if (this.startTime) {
            const elapsedTime = (Date.now() - this.startTime) / 1000;
            if (this.isInOtherMode) {
                this.otherTime += elapsedTime;
            } else {
                this.totalTime += elapsedTime;
            }
            this.saveProjectData({
                totalTime: this.totalTime,
                otherTime: this.otherTime,
                lastUpdated: Date.now()
            });
            this.startTime = null;
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
            this.otherTime = data.otherTime || 0;
        } else {
            this.saveProjectData({
                totalTime: 0,
                otherTime: 0,
                lastUpdated: Date.now()
            });
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
                        this.saveProjectData({ totalTime: 0, otherTime: 0, lastUpdated: Date.now() });
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
        const formatTime = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${hours.toString().padStart(2, '0')}:${minutes
                .toString()
                .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        const codingTime = this.tracker.totalTime || 0;
        const otherTime = this.tracker.otherTime || 0;
        
        // Create TreeItems for both time categories
        const codingTimeItem = new vscode.TreeItem(`⌨️ Coding Time: ${formatTime(codingTime)}`);
        const otherTimeItem = new vscode.TreeItem(`🕒 Other Time: ${formatTime(otherTime)}`);
        
        // Calculate total project time
        const totalTime = codingTime + otherTime;
        const totalTimeItem = new vscode.TreeItem(`⏱️ Total Project Time: ${formatTime(totalTime)}`);

        // Determine coder type based on coding time only
        const timeInMinutes = Math.floor(codingTime / 60);
        let coderType = "";
        
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
        } else if (timeInMinutes <= 120) {
            coderType = "Coding Warrior!";
        } else if (timeInMinutes <= 180) {
            coderType = "Code Master!";
        } else if (timeInMinutes <= 240) {
            coderType = "Legendary Coder!";
        } else {
            coderType = "Coding God Mode! 🔥";
        }
        
        const coderTypeItem = new vscode.TreeItem(`💡 Coder Type: ${coderType}`);
        
        const separatorItem = new vscode.TreeItem("────────────────────────────");
        separatorItem.iconPath = new vscode.ThemeIcon("dash");

        const noteItem = new vscode.TreeItem(
            "Note: Other time tracks work outside VS Code"
        );
        noteItem.description = "Research, planning, etc.";
        noteItem.iconPath = new vscode.ThemeIcon("info");

        return [
            totalTimeItem,
            codingTimeItem,
            otherTimeItem,
            separatorItem,
            coderTypeItem,
            noteItem
        ];
    }
    

}

module.exports = {
    activate,
    deactivate,
};
