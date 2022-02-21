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
	var regExp = /\[[^)]*\]\(([^)]+)\)/;
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
	const storageManager = new LocalStorageService(context.workspaceState);
	// detect .docs folder + store all values
	let docFolder: vscode.Uri | null = await getDocFolderUri();
	if (docFolder !== null) {
		storeDocs(docFolder, storageManager);
	}
	let codeFileUris: readonly string[] = context.workspaceState.keys();

	// enable hover for all the relevant code files
	const hover = vscode.languages.registerHoverProvider(['*'], {
		provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
			if (codeFileUris.includes(document.uri.toString())) {
				const docInfo: Doc | null = storageManager.getValue(document.uri);
				if (docInfo !== null) {
					const doc = new vscode.MarkdownString(`*🔗 Documentation linked by [Mintlify](https://www.mintlify.com/)* <div>${docInfo.content}</div>`);
					doc.supportHtml = true;
					const args = [docInfo.mdFileUri];
					const openCommandUri = vscode.Uri.parse(
						`command:markdown.showPreviewToSide?${encodeURIComponent(JSON.stringify(args))}`
					);
					const footer = new vscode.MarkdownString(`[Open document](${openCommandUri})`);
					footer.isTrusted = true;
					return new vscode.Hover([doc, footer]);
				}
			}
			return null;
		}
	});

	let relink = async () => {
		docFolder = await getDocFolderUri();
		if (docFolder !== null) {
			storeDocs(docFolder, storageManager);
			codeFileUris = context.workspaceState.keys();
		}
	};

	vscode.workspace.onDidSaveTextDocument((doc) => {
		const uri = doc.uri;
		if(uri.path.includes('/.docs/')) {
			relink();
		}
	});

	let openLink = vscode.commands.registerCommand('vscode-link.open-link', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor === null) { return; }
		const document = editor?.document;
		if (document == null) { return; }
		if (codeFileUris.includes(document.uri.toString())) {
			const docInfo: Doc | null = storageManager.getValue(document.uri);
			if (docInfo !== null) {
				let uri = docInfo.mdFileUri;
				vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
			}
		}
	});

	context.subscriptions.push(hover, openLink);
}

// this method is called when your extension is deactivated
export function deactivate() {}
