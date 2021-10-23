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

export class TooltipPanel implements WebviewViewProvider {
  private _view?: WebviewView;
  private _disposables: Disposable[] = [];
  private _extensionUri: Uri;

  constructor(extensionUri: Uri) {
    this._extensionUri = extensionUri;
  }

  public update(content: string) {
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
    content?: string
  ) {
    const toolkitUri = getUri(webview, extensionUri, [
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist",
      "toolkit.js",
    ]);
    const cssUri = getUri(webview, extensionUri, ["media", "main.css"]);

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script type="module" src="${toolkitUri}"></script>
          <link rel="stylesheet" href="${cssUri}">
        </head>
        <body>
          <div class="tooltip">${content ?? ""}</div>
        </body>
      </html>
    `;
  }
}
