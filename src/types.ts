import * as vscode from 'vscode';

export type Doc = {
  mdFileUri: vscode.Uri;
  content: string;
};

export class LocalStorageService {
  constructor(private storage: vscode.Memento) {}
	
  public getValue(uri: vscode.Uri): Doc | null {
    return this.storage.get(uri.toString(), null);
  }

  public setValue(uri: vscode.Uri, value: Doc | null) {
    this.storage.update(uri.toString(), value);
  }

  public isEmpty(): boolean {
    return this.storage.keys().length === 0;
  }

  public keys(): readonly string[] {
    return this.storage.keys();
  }

  public clearValue(uri: string) {
    this.storage.update(uri, undefined);
  }
}
