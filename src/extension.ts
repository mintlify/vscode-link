// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LocalStorageService, Doc } from './types';

const getDocFolderUri = async () : Promise<vscode.Uri | null> => {
	const root = vscode.workspace?.workspaceFolders![0]?.uri;
	const files = await vscode.workspace.fs.readDirectory(root);
	const docFolder: [string, vscode.FileType] | undefined = files.find(file => {
		return file[1] === 2 && file[0] === '.docs';
	});
	if (typeof docFolder === 'undefined') {
		return null;
	} else {
		const directoryPath = `${root}/${docFolder[0]}`;
		const directoryPathUri = vscode.Uri.parse(directoryPath);
		return directoryPathUri;
	}
};

const getRelatedCodeFilePath = (mdContent: string): string => {
	const firstLine = mdContent.split('\n')[0];
	// regex for [whatever](path)
	var regExp = /\[[^)]+\]\(([^)]+)\)/;
	const fileExtension = regExp.exec(firstLine)![1];
	return fileExtension;
};

const getDesiredContent = (mdContent: string): string => {
	const lines = mdContent.split('\n');
	lines.splice(0,1);
	const desiredContent = lines.join('\n');
	return desiredContent;
};

const getRelatedCodeFileInfo = (mdContent: string): { path: string; desiredContent: string } => {
	const path = getRelatedCodeFilePath(mdContent);
	const desiredContent = getDesiredContent(mdContent);
	return {path, desiredContent};
};

const storeDocs = async (docFolderUri: vscode.Uri, storageManager: LocalStorageService) => {
	const files = await vscode.workspace.fs.readDirectory(docFolderUri);
	files.forEach(async file => {
		const curFileName = file[0];
		const curFilePath = `${docFolderUri}/${curFileName}`;
		const curFilePathUri = vscode.Uri.parse(curFilePath);
		if (file[1] === 1) {
			const fileExtensionRegex = /(?:\.([^.]+))?$/;
			const fileExtension = fileExtensionRegex.exec(curFileName)![1];
			if (fileExtension !== null && fileExtension === 'md') {
				const readFileRaw = await vscode.workspace.fs.readFile(curFilePathUri);
				const fileContent = readFileRaw.toString();
				const { path, desiredContent } = getRelatedCodeFileInfo(fileContent);
				const codeFilePathUri = vscode.Uri.joinPath(docFolderUri, path); // key = code filename
				const value = { mdFileUri: curFilePathUri, content: desiredContent };
				storageManager.setValue(codeFilePathUri, value);
			}
		} else {
			// if folder, traverse thru it
			await storeDocs(curFilePathUri, storageManager);
		}
	});
};

export async function activate(context: vscode.ExtensionContext) {
	const storageManager = new LocalStorageService(context.globalState);
	// detect .docs folder + store all values
	const docFolder: vscode.Uri | null = await getDocFolderUri();
	if (docFolder !== null) {
		storeDocs(docFolder, storageManager);
	}
	const codeFileUris: readonly string[] = context.globalState.keys();

	// enable hover for all the relevant code files
	vscode.languages.registerHoverProvider(['*'], {
		provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
			if (codeFileUris.includes(document.uri.toString())) {
				const docInfo: Doc | null = storageManager.getValue(document.uri);
				if (docInfo !== null) {
					const doc = new vscode.MarkdownString(docInfo.content, true);
					return new vscode.Hover([doc]);
					// TODO: append "Open document" + make it look nice
					// gitlens?
				}
			}
			return null;
		}
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-link.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vscode-link!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
