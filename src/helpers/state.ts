import { Uri, workspace } from 'vscode';
import { LocalStorageService } from '../types';
import { getRelatedCodeFileInfo } from './parser';

export const storeDocs = async (docFolderUri: Uri, storageManager: LocalStorageService) => {
	const files = await workspace.fs.readDirectory(docFolderUri);
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
				const { paths, desiredContent } = getRelatedCodeFileInfo(fileContent);
				const codeFilePathUris = paths.map((path) => Uri.joinPath(docFolderUri, path)); // key = code filename
				const value = { mdFileUri: curFilePathUri, content: desiredContent };
        codeFilePathUris.map((uri) => storageManager.setValue(uri, value));
			}
		} else {
			// if folder, traverse thru it
			await storeDocs(curFilePathUri, storageManager);
		}
	});
};