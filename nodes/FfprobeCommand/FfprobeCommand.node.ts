import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { path as ffprobePath } from 'ffprobe-static'; // eslint-disable-line
import { exec } from 'child_process'; // eslint-disable-line

const execCommand = (command: string): Promise<{ stdout: string; stderr: string }> => {
	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error && stderr) {
				reject(stderr);
			}
			resolve({ stdout, stderr });
		});
	});
};

export class FfprobeCommand implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FFprobe command',
		name: 'ffprobeCommand',
		icon: { light: 'file:ffprobe-command.svg', dark: 'file:ffprobe-command.dark.svg' },
		group: ['input'],
		version: 1,
		description: 'FFprobe command',
		defaults: {
			name: 'Execute FFprobe command',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Command',
				name: 'command',
				type: 'string',
				default: '',
				placeholder:
					'ffprobe -v quiet -print_format json -show_format -show_streams /folder/input.mp4',
				description: 'FFprobe command',
				required: true,
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let command: string;

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				command = this.getNodeParameter('command', itemIndex, '') as string;
				item = items[itemIndex];

				if (command.startsWith('ffprobe') && ffprobePath) {
					const results = await execCommand(command.replace(/^ffprobe/, ffprobePath));

					item.json = {
						...results,
						command,
					};
				} else {
					throw new NodeOperationError(this.getNode(), 'Command is not a valid ffprobe command', {
						itemIndex,
					});
				}
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}
