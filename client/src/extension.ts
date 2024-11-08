import { ExtensionContext, workspace, commands, window } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions
} from 'vscode-languageclient/node';

let client: LanguageClient;
let lastHost: string | undefined = undefined;
let lastPort: number | undefined = undefined;

export function activate(context: ExtensionContext) {
	const executable: string | undefined = workspace.getConfiguration("hl7-ls").get("executablePath");
	const defaultSendHost: string | undefined = workspace.getConfiguration("hl7-ls").get("defaultSendHost");
	const defaultSendPort: number | undefined = workspace.getConfiguration("hl7-ls").get("defaultSendPort");
	const disableStandardTableValidations: boolean | undefined = workspace.getConfiguration("hl7-ls").get("disableStandardTableValidations");

	// TODO: build runtime args based on preferences in settings

	const runArgs: string[] = ["--vscode"];
	if (disableStandardTableValidations) {
		runArgs.push("--disable-std-table-validations");
	}
	const debugArgs: string[] = runArgs.concat(["-vv", "--colour", "always", "log-to-file", "/tmp/hl7-ls-vscode.log"]);

	const serverOptions: ServerOptions = {
		run: {
			command: executable,
			args: runArgs,
		},
		debug: {
			command: executable,
			args: debugArgs,
		}
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'hl7' }],
		markdown: {
			isTrusted: true,
			supportHtml: true
		}
	};

	client = new LanguageClient(
		'hl7-ls',
		'HL7 LS',
		serverOptions,
		clientOptions
	);

	context.subscriptions.push(commands.registerCommand('hl7-ls.sendMessage', async () => {
		const uri = window.activeTextEditor?.document.uri.toString();
		const hostname = await window.showInputBox({
			prompt: "Hostname:",
			value: lastHost ?? defaultSendHost,
			valueSelection: [0, (lastHost ?? defaultSendHost)?.length ?? 0],
			placeHolder: "localhost"
		});
		const portValue = lastPort?.toString() ?? defaultSendPort?.toString() ?? "";
		const port = await window.showInputBox({
			prompt: "Port:",
			value: portValue,
			valueSelection: [0, portValue.length],
			placeHolder: "2575",
			validateInput: (value: string) => {
				const port = parseInt(value);
				if (isNaN(port) || port < 1 || port > 65535) {
					return "Port must be a number between 1 and 65535";
				}
				return null;
			}
		});
		if (!uri || !hostname || !port) {
			return;
		}
		const portNum = parseInt(port);

		lastHost = hostname;
		lastPort = portNum;

		const response: string = await client.sendRequest("workspace/executeCommand", {
			command: "hl7.sendMessage", arguments: [
				uri,
				hostname,
				portNum
			]
		});

		window.showInformationMessage("HL7 response: \n\n" + response);
	}));

	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
