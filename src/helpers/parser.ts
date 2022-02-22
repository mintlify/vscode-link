const removeSlash = (fileName: string): string => {
	if (fileName.charAt(fileName.length - 1) === '\\') {
		return fileName.slice(0,-1);
	} else {
		return fileName;
	}
};

const getRelatedCodeFilePaths = (mdContent: string): string[] => {
	const firstChunk = mdContent.split('\n\n')[0];
  const lines = firstChunk.split('\n');
	// regex for [whatever](path)
	var regExp = /\[[^)]*\]\(([^)]+)\)/;
	const fileNames: string[] = [];
	lines.forEach((line) => {
		const fileName = regExp.exec(line);
		if (fileName != null && fileName[1] != null) { 
			fileNames.push(removeSlash(fileName[1]));
		}
	});

	return fileNames;
};

const getDesiredContent = (mdContent: string): string => {
	const lines = mdContent.split('\n');
	lines.splice(0,1);
	const desiredContent = lines.join('\n');
	return desiredContent;
};

export const getRelatedCodeFileInfo = (mdContent: string): { paths: string[]; desiredContent: string } | null => {
	const paths = getRelatedCodeFilePaths(mdContent);
	if (paths.length === 0) {
		return null;
	}
	const desiredContent = getDesiredContent(mdContent);
	return {paths, desiredContent};
};