const getRelatedCodeFilePaths = (mdContent: string): string[] => {
	const firstChunk = mdContent.split('\n\n')[0];
  const lines = firstChunk.split('\n');
	// regex for [whatever](path)
	var regExp = /\[[^)]*\]\(([^)]+)\)/;
	const fileNames = lines.map((line) => regExp.exec(line)![1]);
  console.log(fileNames);
	return fileNames;
};

const getDesiredContent = (mdContent: string): string => {
	const lines = mdContent.split('\n');
	lines.splice(0,1);
	const desiredContent = lines.join('\n');
	return desiredContent;
};

export const getRelatedCodeFileInfo = (mdContent: string): { paths: string[]; desiredContent: string } => {
	const paths = getRelatedCodeFilePaths(mdContent);
	const desiredContent = getDesiredContent(mdContent);
	return {paths, desiredContent};
};