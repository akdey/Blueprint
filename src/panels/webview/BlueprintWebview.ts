import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Loads the sidebar webview HTML from media/sidebar.html.
 * All resource URIs are resolved against the extension's media folder.
 */
export function getBlueprintWebviewContent(
    webview: vscode.Webview,
    extensionPath: string
): string {
    const mediaPath = path.join(extensionPath, 'media');
    const htmlPath = path.join(mediaPath, 'sidebar.html');

    if (!fs.existsSync(htmlPath)) {
        return getFallback();
    }

    let html = fs.readFileSync(htmlPath, 'utf-8');
    const mediaUri = webview.asWebviewUri(vscode.Uri.file(mediaPath));
    html = html.replace(/\{\{MEDIA_URI\}\}/g, mediaUri.toString());
    return html;
}

function getFallback(): string {
    return `<!DOCTYPE html><html>
  <body style="padding:1rem;color:var(--vscode-foreground);font-family:var(--vscode-font-family)">
    <p>Blueprint UI could not be loaded. Please rebuild the extension.</p>
  </body></html>`;
}
