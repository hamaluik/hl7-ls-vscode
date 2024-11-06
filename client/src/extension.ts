import { ExtensionContext, workspace } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(_context: ExtensionContext) {
	const executable: string = workspace.getConfiguration("hl7-ls").get("serverPath");

	// TODO: build runtime args based on preferences in settings

	const serverOptions: ServerOptions = {
		run: {
			command: executable,
			args: [],
		},
		debug: {
			command: executable,
			//transport: TransportKind.stdio, // don't enable this; all it does is append `--stdio` to the args and breaks things
			args: ["-vv", "--colour", "always", "log-to-file", "/tmp/hl7-ls-vscode.log"],
		}
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'hl7' }],
		markdown: {
			isTrusted: true,
		}
	};

	client = new LanguageClient(
		'hl7-ls',
		'HL7 LS',
		serverOptions,
		clientOptions
	);

	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
