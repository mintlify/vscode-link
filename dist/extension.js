/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LocalStorageService = void 0;
class LocalStorageService {
    constructor(storage) {
        this.storage = storage;
    }
    getValue(uri) {
        return this.storage.get(uri.toString(), null);
    }
    setValue(uri, value) {
        this.storage.update(uri.toString(), value);
    }
    isEmpty() {
        return this.storage.keys().length === 0;
    }
}
exports.LocalStorageService = LocalStorageService;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __webpack_require__(1);
const types_1 = __webpack_require__(2);
const getDocFolderUri = async () => {
    const root = vscode.workspace?.workspaceFolders[0]?.uri;
    const files = await vscode.workspace.fs.readDirectory(root);
    const docFolder = files.find(file => {
        return file[1] === 2 && file[0] === '.docs';
    });
    if (typeof docFolder === 'undefined') {
        return null;
    }
    else {
        const directoryPath = `${root}/${docFolder[0]}`;
        const directoryPathUri = vscode.Uri.parse(directoryPath);
        return directoryPathUri;
    }
};
const getRelatedCodeFilePath = (mdContent) => {
    const firstLine = mdContent.split('\n')[0];
    // regex for [whatever](path)
    var regExp = /\[[^)]*\]\(([^)]+)\)/;
    const fileExtension = regExp.exec(firstLine)[1];
    return fileExtension;
};
const getDesiredContent = (mdContent) => {
    const lines = mdContent.split('\n');
    lines.splice(0, 1);
    const desiredContent = lines.join('\n');
    return desiredContent;
};
const getRelatedCodeFileInfo = (mdContent) => {
    const path = getRelatedCodeFilePath(mdContent);
    const desiredContent = getDesiredContent(mdContent);
    return { path, desiredContent };
};
const storeDocs = async (docFolderUri, storageManager) => {
    const files = await vscode.workspace.fs.readDirectory(docFolderUri);
    files.forEach(async (file) => {
        const curFileName = file[0];
        const curFilePath = `${docFolderUri}/${curFileName}`;
        const curFilePathUri = vscode.Uri.parse(curFilePath);
        if (file[1] === 1) {
            const fileExtensionRegex = /(?:\.([^.]+))?$/;
            const fileExtension = fileExtensionRegex.exec(curFileName)[1];
            if (fileExtension !== null && fileExtension === 'md') {
                const readFileRaw = await vscode.workspace.fs.readFile(curFilePathUri);
                const fileContent = readFileRaw.toString();
                const { path, desiredContent } = getRelatedCodeFileInfo(fileContent);
                const codeFilePathUri = vscode.Uri.joinPath(docFolderUri, path); // key = code filename
                const value = { mdFileUri: curFilePathUri, content: desiredContent };
                storageManager.setValue(codeFilePathUri, value);
            }
        }
        else {
            // if folder, traverse thru it
            await storeDocs(curFilePathUri, storageManager);
        }
    });
};
async function activate(context) {
    const storageManager = new types_1.LocalStorageService(context.globalState);
    // detect .docs folder + store all values
    const docFolder = await getDocFolderUri();
    if (docFolder !== null) {
        storeDocs(docFolder, storageManager);
    }
    const codeFileUris = context.globalState.keys();
    // enable hover for all the relevant code files
    vscode.languages.registerHoverProvider(['*'], {
        provideHover(document, position, token) {
            if (codeFileUris.includes(document.uri.toString())) {
                const docInfo = storageManager.getValue(document.uri);
                if (docInfo !== null) {
                    const doc = new vscode.MarkdownString(docInfo.content);
                    const args = [docInfo.mdFileUri];
                    const openCommandUri = vscode.Uri.parse(`command:vscode.open?${encodeURIComponent(JSON.stringify(args))}`);
                    const footer = new vscode.MarkdownString(`[Open document](${openCommandUri})`, true);
                    footer.isTrusted = true;
                    return new vscode.Hover([doc, footer]);
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
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map