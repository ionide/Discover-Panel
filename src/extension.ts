import { commands, ExtensionContext, window } from "vscode";
import { HelloWorldPanel } from "./panels/HelloWorldPanel";

export function activate(context: ExtensionContext) {
  // Register Copilot Lab sidebar as a webview
  context.subscriptions.push(
    window.registerWebviewViewProvider(
      "discoverpanel.view",
      new HelloWorldPanel(context.extensionUri)
    )
  );
}
