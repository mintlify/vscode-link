import { Uri, workspace, FileType } from 'vscode';
import { LocalStorageService } from '../types';
import { getRelatedCodeFileInfo } from './parser';

const unlinkDeletedLinks = async (docFolderUri: Uri, storageManager: LocalStorageService, files: [string, FileType][]) => {
	const keys = storageManager.keys();

	keys.forEach((key) => {
		let fileMatchExists = false;
		files.forEach((file) => {
			const curFileName = file[0];
			const curFilePath = `${docFolderUri}/${curFileName}`;
			const curFilePathUri = Uri.parse(curFilePath);
			if (curFilePathUri.toString() === key) {
				fileMatchExists = true;
			}
		});
		if (!fileMatchExists) {
			storageManager.clearValue(key);
		}
	});
};

const storeDocs = async (docFolderUri: Uri, storageManager: LocalStorageService, files: [string, FileType][]) => {
	files.forEach(async file => {
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
					codeFilePathUris.map((uri) => storageManager.setValue(uri, value));
				}
			}
		} else {
			// if folder, traverse thru it
			const subFiles = await workspace.fs.readDirectory(curFilePathUri);
			await storeDocs(curFilePathUri, storageManager, subFiles);
		}
	});
};

export const updateDocs = async (docFolderUri: Uri, storageManager: LocalStorageService) => {
	const files = await workspace.fs.readDirectory(docFolderUri);
	await storeDocs(docFolderUri, storageManager, files);
	await unlinkDeletedLinks(docFolderUri, storageManager, files);
};
