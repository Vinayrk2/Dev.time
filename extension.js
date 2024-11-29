// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	const tracker = new TimeTracker(context.workspaceState)
	
	tracker.startTracking()
	// const disposable = vscode.commands.registerCommand('project-time.startTimer', function () {
	// 	tracker.loadProjectData();
	// });

	const disposable2 = vscode.commands.registerCommand('project-time.showTimespend', function () {
		tracker.showTimeSpent()
	})

	// Call the check function on activation
}

class TimeTracker{
	constructor(workspaceState){
		this.starttime = Date.now();
		this.workspaceState = workspaceState
		this.workspaceFolder = vscode.workspace.workspaceFolders?.[0]
		this.dataFilePath = this.workspaceFolder ? path.join(this.workspaceFolder.uri.fsPath, '.vscode', 'timer-data.json') : null;
		this.checkAndPromptForTimer(0);
		this.totaltime = this.loadProjectData()

	}

	startTracking(){
		vscode.window.onDidChangeWindowState((state)=>{
			if(state.focused){
				if(!this.starttime)
					this.starttime = Date.now()
			}else{
				this.updateTime()
			}
		})

		vscode.workspace.onDidCloseTextDocument((state)=>{
			this.updateTime()
		})
		
		vscode.workspace.onDidChangeWorkspaceFolders((s)=>{
			this.updateTime()
		})

		vscode.workspace.onDidSaveTextDocument((e)=>{
			this.updateTime()
		})
	}

	updateTime(){
		if(this.starttime){
			const etime = (Date.now() - this.starttime)/1000 // spent time in sec.
			this.totaltime += etime;
			this.saveProjectData({"data_file_path":this.dataFilePath, "total_time":this.totaltime, "last_updated":Date.now()})
			// this.workspaceState.update('timespent',this.totaltime)
			this.starttime = 0
		}
	}

	showTimeSpent(){

		this.checkAndPromptForTimer(0)

		const time={
			"hours" : parseInt(this.totaltime / 3600),
			"minutes": parseInt((this.totaltime % 3600)/60)
		}

		if(this.totaltime)
		vscode.window.showInformationMessage(`Total time spent: ${time.hours.toString().padStart(2,'0')}: ${time.minutes.toString().padStart(2,'0')}`)
	}

	loadProjectData = () => {
        if (!this.dataFilePath) {
            vscode.window.showErrorMessage('No workspace folder found!');
            return 0;
        }

        if (fs.existsSync(this.dataFilePath)) {
            const data = JSON.parse(fs.readFileSync(this.dataFilePath, 'utf8'));
            vscode.window.showInformationMessage(
                `Loaded project data.`
            );
            return data.total_time;
        } else {
            vscode.window.showWarningMessage('Try Again, initializing the data for the project.',['- if already there was timeline','then try to switch to the initial project folder']);
            this.saveProjectData({"data_file_path":this.dataFilePath, "total_time":0, "last_updated":Date.now()})
			return 0;
        }
    };

	saveProjectData = (data) => {
        if (!this.dataFilePath) {
            vscode.window.showErrorMessage('No workspace folder found!');
            return;
        }

        this.ensureVSCodeFolder();

        fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2));
        vscode.window.showInformationMessage('Project-specific data saved!');
    };

	ensureVSCodeFolder() {
        if (this.workspaceFolder) {
            const vscodeDir = path.join(this.workspaceFolder.uri.fsPath, '.vscode');
            if (!fs.existsSync(vscodeDir)) {
                fs.mkdirSync(vscodeDir);
            }
        }
    }



	// Check for existing timer data and prompt user
    checkAndPromptForTimer(flag=1) {
        if (!this.dataFilePath) {
            vscode.window.showErrorMessage('No workspace folder found!');
            return;
        }

        // Check if timer data exists
        if (!fs.existsSync(this.dataFilePath)) {
            vscode.window
                .showInformationMessage(
                    'No timer data found for this project. Do you want to create a timer?',
                    'Yes',
                    'No'
                )
                .then((selection) => {
                    if (selection === 'Yes') {
                        // Initialize timer data
                        this.ensureVSCodeFolder();
                        const initialData = { timer: 0, lastUpdated: new Date().toISOString() };
                        fs.writeFileSync(this.dataFilePath, JSON.stringify(initialData, null, 2));
                        vscode.window.showInformationMessage('Timer initialized for this project!');
                    } else {
                        vscode.window.showInformationMessage('No timer created.');
                    }
                });
        } else {
			if(flag)
            vscode.window.showInformationMessage('Timer data already exists for this project.');
        }
    }

}


// This method is called when your extension is deactivated
function deactivate() {
	
}



module.exports = {
	activate,
	deactivate
}
