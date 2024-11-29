const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

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

function deactivate() {}

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
        this.loadProjectData(); 
        this.checkAndPromptForTimer();
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

    showTimeSpent() {
        const time = {
            hours: Math.floor(this.totalTime / 3600),
            minutes: Math.floor((this.totalTime % 3600) / 60),
            seconds: Math.floor(this.totalTime % 60),
        };
        vscode.window.showInformationMessage(
            `Total time spent: ${time.hours.toString().padStart(2, '0')}:${time.minutes
                .toString()
                .padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`
        );
    }

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
                });
        }
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
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);
    
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
            let codertype = "";
            let temp = Math.floor(time / 60)

            if (temp === 0) {
                codertype = "tempr Not Started";
            } else if (temp > 0 && temp <= 600) { // Less than or equal to 10 minutes
                codertype = "Just Begin";
            } else if (temp > 600 && temp <= 1800) { // Between 10 minutes and 30 minutes
                codertype = "Warming Up!";
            } else if (temp > 1800 && temp <= 2700) { // Between 30 minutes and 45 minutes
                codertype = "Yay, I love the work done!";
            } else if (temp > 2700 && temp <= 3600) { // Between 45 minutes and 1 hour
                codertype = "You're in the zone!";
            } else if (temp > 3600 && temp <= 4500) { // Between 1 hour and 1 hour 15 minutes
                codertype = "Keep Crushing It!";
            } else if (temp > 4500 && temp <= 5400) { // Between 1 hour 15 minutes and 1 hour 30 minutes
                codertype = "Wow, amazing progress!";
            } else if (temp > 5400) { // More than 1 hour 30 minutes
                codertype = "Salutation! Exceptional effort!";
            }
            

        const treeItem = new vscode.TreeItem(`${timeString}`);
        treeItem.description = `${codertype}`;
        treeItem.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'icon.png'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'icon.png'),
        };
    
        return [treeItem];
    }
    
}

module.exports = {
    activate,
    deactivate,
};
