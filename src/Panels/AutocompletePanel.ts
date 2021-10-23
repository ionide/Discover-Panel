import {
  Disposable,
  Webview,
  window,
  Uri,
  WebviewViewProvider,
  CancellationToken,
  WebviewView,
  WebviewViewResolveContext,
} from "vscode";
import { getUri } from "../utils";

export class AutocompletePanel implements WebviewViewProvider {
  private _view?: WebviewView;
  private _disposables: Disposable[] = [];
  private _extensionUri: Uri;

  constructor(extensionUri: Uri) {
    this._extensionUri = extensionUri;
  }

  public update(content: string[]) {
    if (this._view) {
      this._view.webview.html = this._getWebviewContent(
        this._view.webview,
        this._extensionUri,
        content
      );
    }
  }

  resolveWebviewView(
    webviewView: WebviewView,
    _context: WebviewViewResolveContext<unknown>,
    _token: CancellationToken
  ): void | Thenable<void> {
    this._view = webviewView;
    this._view.onDidDispose(this.dispose, null, this._disposables);
    this._view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    this._view.webview.html = this._getWebviewContent(
      this._view.webview,
      this._extensionUri
    );
    this._setWebviewMessageListener(this._view.webview);
  }

  public dispose() {
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(
    webview: Webview,
    extensionUri: Uri,
    content?: string[]
  ) {
    const toolkitUri = getUri(webview, extensionUri, [
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist",
      "toolkit.js",
    ]);
    const mainUri = getUri(webview, extensionUri, ["media", "main.js"]);
    const cssUri = getUri(webview, extensionUri, ["media", "main.css"]);
    let table = "";
    content?.forEach((item) => {
      table += `<vscode-data-grid-row><vscode-data-grid-cell><code>${item}</code></vscode-data-grid-cell></vscode-data-grid-row>`;
    });

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script type="module" src="${toolkitUri}"></script>
          <script type="module" src="${mainUri}"></script>
          <link rel="stylesheet" href="${cssUri}">
        </head>
        <body>
          <vscode-data-grid id="basic-grid" aria-label="Default">
            ${table}
          </vscode-data-grid>
        </body>
      </html>
    `;
  }

  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case "hello":
            // Code that should run in response to the hello message command
            window.showInformationMessage(text);
            return;
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
        }
      },
      undefined,
      this._disposables
    );
  }
}
