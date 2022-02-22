import { Uri, workspace, FileType } from 'vscode';
import { LocalStorageService } from '../types';
import { getRelatedCodeFileInfo } from './parser';

const unlinkDeletedLinks = (docFolderUri: Uri, storageManager: LocalStorageService, files: Uri[]) => {
	const keys = storageManager.keys();

	keys.forEach((key) => {
		let fileMatchExists = false;
		files.forEach((file) => {
			if (file.toString() === key) {
				fileMatchExists = true;
			}
		});
		if (!fileMatchExists) {
			storageManager.clearValue(key);
		}
	});
};

const storeDocs = async (docFolderUri: Uri, storageManager: LocalStorageService, files: [string, FileType][]): Promise<Uri[]> => {
	const codeFiles: Uri[] = [];
	const filePromises = files.map(async file => {
		const curFileName = file[0];
		const curFilePath = `${docFolderUri}/${curFileName}`;
		const curFilePathUri = Uri.parse(curFilePath);
		if (file[1] === 1) {
			const fileExtensionRegex = /(?:\.([^.]+))?$/;
			const fileExtension = fileExtensionRegex.exec(curFileName)![1];
			if (fileExtension !== null && fileExtension === 'md') {
				const readFileRaw = await workspace.fs.readFile(curFilePathUri);
				const fileContent = readFileRaw.toString();
				const codeFileInfo = getRelatedCodeFileInfo(fileContent);
				if (codeFileInfo != null) {
					const codeFilePathUris = codeFileInfo.paths.map((path) => Uri.joinPath(docFolderUri, path)); // key = code filename
					const value = { mdFileUri: curFilePathUri, content: codeFileInfo.desiredContent };
					codeFilePathUris.map((uri) => {
						storageManager.setValue(uri, value);
						codeFiles.push(uri);
					});
				}
			}
		} else {
			// if folder, traverse thru it
			const subFiles = await workspace.fs.readDirectory(curFilePathUri);
			await storeDocs(curFilePathUri, storageManager, subFiles);
		}
	});
	await Promise.all(filePromises);
	return codeFiles;
};

export const updateDocs = async (docFolderUri: Uri, storageManager: LocalStorageService) => {
	const files = await workspace.fs.readDirectory(docFolderUri);
	const relevantCodeFiles = await storeDocs(docFolderUri, storageManager, files);
	console.log(relevantCodeFiles);
	unlinkDeletedLinks(docFolderUri, storageManager, relevantCodeFiles);
};
