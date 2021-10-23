import showdown = require("showdown");
import {
  commands,
  CompletionItemKind,
  CompletionList,
  ExtensionContext,
  Hover,
  Position,
  Range,
  window,
} from "vscode";
import { AutocompletePanel } from "./Panels/AutocompletePanel";
import { TooltipPanel } from "./Panels/TooltipPanel";

export function activate(context: ExtensionContext) {
  let tooltipPanel = new TooltipPanel(context.extensionUri);
  let autocompeltePanel = new AutocompletePanel(context.extensionUri);
  let converter = new showdown.Converter({ optionKey: "value" });

  context.subscriptions.push(
    window.registerWebviewViewProvider("discoverpanel.tooltip", tooltipPanel),
    window.registerWebviewViewProvider(
      "discoverpanel.autocomplete",
      autocompeltePanel
    )
  );

  let lastRangeTooltip: Range | undefined;
  window.onDidChangeTextEditorSelection(async (e) => {
    let range = e.textEditor.document.getWordRangeAtPosition(
      e.textEditor.selection.active
    );
    if (
      range &&
      (lastRangeTooltip === undefined || !range.isEqual(lastRangeTooltip))
    ) {
      lastRangeTooltip = range;
      let result: Hover[] | undefined = await commands.executeCommand(
        "vscode.executeHoverProvider",
        e.textEditor.document.uri,
        range.start
      );
      if (result) {
        console.log(result);
        let ctn = "";
        result.forEach((r) => {
          ctn += r.contents
            .map((n) => (typeof n === "string" ? n : n.value))
            .join("\n");
        });
        // converter.setOption;
        tooltipPanel.update(converter.makeHtml(ctn));
      }
    }
  });

  let lastPositionAutocomplete: Position | undefined;
  window.onDidChangeTextEditorSelection(async (e) => {
    let range = e.textEditor.document.getWordRangeAtPosition(
      e.textEditor.selection.active
    );
    if (
      range &&
      (lastPositionAutocomplete === undefined ||
        !range.start.isEqual(lastPositionAutocomplete))
    ) {
      lastPositionAutocomplete = range.start;
      let result: CompletionList | undefined = await commands.executeCommand(
        "vscode.executeCompletionItemProvider",
        e.textEditor.document.uri,
        lastPositionAutocomplete
      );
      if (result) {
        console.log(result);

        autocompeltePanel.update(
          result.items
            .filter((r) => r.kind !== CompletionItemKind.Snippet)
            .map((r) => (typeof r.label === "string" ? r.label : r.label.label))
        );
      }
    }
  });
}
