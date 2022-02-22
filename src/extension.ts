// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LocalStorageService, Doc } from './types';
import { updateDocs } from './helpers/state';

const getDocFolderUri = async () : Promise<vscode.Uri | null> => {
	const root = vscode.workspace?.workspaceFolders![0]?.uri;
	const files = await vscode.workspace.fs.readDirectory(root);
	const docFolder: [string, vscode.FileType] | undefined = files.find(file => {
		return file[1] === 2 && file[0] === 'docs';
	});
	if (typeof docFolder === 'undefined') {
		return null;
	} else {
		const directoryPath = `${root}/${docFolder[0]}`;
		const directoryPathUri = vscode.Uri.parse(directoryPath);
		return directoryPathUri;
	}
};

const matchingSubPath = (codeFileUris: readonly string[], uri: string): string[] => {
	const matches = codeFileUris.filter(elem => uri.includes(elem));
	return matches;
};

export async function activate(context: vscode.ExtensionContext) {
	const storageManager = new LocalStorageService(context.workspaceState);
	// detect docs folder + store all values
	let docFolder: vscode.Uri | null = await getDocFolderUri();
	if (docFolder !== null) {
		updateDocs(docFolder, storageManager);
	}
	let codeFileUris: readonly string[] = context.workspaceState.keys();

	const showDocHover = (uri: vscode.Uri): vscode.Hover | null => {
		const docInfo: Doc | null = storageManager.getValue(uri);
		if (docInfo !== null) {
			const args = [docInfo.mdFileUri];
			const openCommandUri = vscode.Uri.parse(
				`command:markdown.showPreviewToSide?${encodeURIComponent(JSON.stringify(args))}`
			);
			const doc = new vscode.MarkdownString(`[🔗 Open document (⌘ + 8)](${openCommandUri}) <div>${docInfo.content}</div>`);
			doc.supportHtml = true;
			doc.isTrusted = true;
			return new vscode.Hover([doc]);
		}
		return null;
	};

	const showDocHovers = (uris: vscode.Uri[]): vscode.Hover | null => {
		if (uris.length === 0) { return null; }
		const mdDocs: vscode.MarkdownString[] = [];
		uris.forEach(uri => {
			const docInfo: Doc | null = storageManager.getValue(uri);
			if (docInfo !== null) {
				const args = [docInfo.mdFileUri];
				const openCommandUri = vscode.Uri.parse(
					`command:markdown.showPreviewToSide?${encodeURIComponent(JSON.stringify(args))}`
				);
				const doc = new vscode.MarkdownString(`[🔗 Open document (⌘ + 8)](${openCommandUri}) <div>${docInfo.content}</div>`);
				doc.supportHtml = true;
				doc.isTrusted = true;
				mdDocs.push(doc);
			}
		});
		if (mdDocs.length === 0) { return null; }
		return new vscode.Hover(mdDocs);
	};

	// enable hover for all the relevant code files
	const hover = vscode.languages.registerHoverProvider(['*'], {
		provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
			const uri = document.uri.toString();
			const subPaths = matchingSubPath(codeFileUris, uri);
			if (codeFileUris.includes(uri)) {
				return showDocHover(document.uri);
			} else if (subPaths.length > 0) {
				const subPathUris = subPaths.map(subpath => vscode.Uri.parse(subpath));
				return showDocHovers(subPathUris);
			}
			return null;
		}
	});

	let relink = async () => {
		docFolder = await getDocFolderUri();
		if (docFolder !== null) {
			await updateDocs(docFolder, storageManager);
			codeFileUris = context.workspaceState.keys();
		}
	};

	vscode.workspace.onDidSaveTextDocument(async (doc) => {
		const uri = doc.uri;
		if(uri.path.includes('/docs/')) {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: '⛓️ Relinking links',
			}, async () => {
				await relink();
			});
		}
	});

	const openLinkGivenUri = (uri: vscode.Uri) => {
		const docInfo: Doc | null = storageManager.getValue(uri);
		if (docInfo !== null) {
			let mdFileUri = docInfo.mdFileUri;
			vscode.commands.executeCommand('markdown.showPreviewToSide', mdFileUri);
		} else {
			vscode.window.showInformationMessage('🔒 No link detected.');
		}
	};

	const getLowestLevelUri = (uris: string[]): string => {
		return uris.reduce(function(a, b) {
			return a.length >= b.length ? a : b; // the longer the path, the lower it is
		});
	};

	let openLink = vscode.commands.registerCommand('mintlify.open-link', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor === null) { return; }
		const document = editor?.document;
		if (document == null) { return; }
		const uri = document.uri.toString();
		const subPaths = matchingSubPath(codeFileUris, uri);
		if (codeFileUris.includes(uri)) {
			openLinkGivenUri(document.uri);
		} else if (subPaths.length > 0) {
			const lowestLvlUri = vscode.Uri.parse(getLowestLevelUri(subPaths));
			await openLinkGivenUri(lowestLvlUri);
		} else {
			vscode.window.showInformationMessage('🔒 No link detected.');
		}
	});

	context.subscriptions.push(hover, openLink);
}

// this method is called when your extension is deactivated
export function deactivate() {}
