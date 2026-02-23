import * as vscode from 'vscode';
import { BlueprintViewProvider } from './panels/BlueprintViewProvider';
import { ProjectStateManager } from './state/ProjectStateManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('[Blueprint] Extension activated');

    const stateManager = new ProjectStateManager(context);
    const provider = new BlueprintViewProvider(context, stateManager);

    // Register the sidebar WebviewViewProvider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            BlueprintViewProvider.viewType,
            provider,
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );

    // Command: Focus sidebar
    context.subscriptions.push(
        vscode.commands.registerCommand('blueprint.start', () => {
            vscode.commands.executeCommand('blueprint.sidebarView.focus');
        })
    );

    // Command: Open Blueprint settings in VS Code's Settings UI
    context.subscriptions.push(
        vscode.commands.registerCommand('blueprint.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'blueprint');
        })
    );

    // Command: Reset project
    context.subscriptions.push(
        vscode.commands.registerCommand('blueprint.reset', async () => {
            const confirm = await vscode.window.showWarningMessage(
                'Reset Blueprint project? All progress will be lost.',
                { modal: true },
                'Reset'
            );
            if (confirm === 'Reset') {
                await provider.resetProject();
                vscode.window.showInformationMessage('Blueprint project reset.');
            }
        })
    );
}

export function deactivate() { }
