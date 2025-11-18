import fs from 'fs'; // eslint-disable-line
import { ffmpegPath, ffprobePath } from 'ffmpeg-ffprobe-static'; // eslint-disable-line
import { exec } from 'child_process'; // eslint-disable-line

export const execCommand = (command: string): Promise<{ stdout: string; stderr: string }> => {
	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error && stderr) {
				reject(stderr);
			}
			resolve({ stdout, stderr });
		});
	});
};

export const getFfmpegFfprobe = async (): Promise<{ ffmpegPath: string; ffprobePath: string }> => {
	if (!ffmpegPath || !ffprobePath) {
		throw new Error("[n8n-nodes-m3u8-downloader] Can't found ffmpeg and ffprobe");
	}

	if (!fs.existsSync(ffmpegPath) || !fs.existsSync(ffprobePath)) {
		console.log('[n8n-nodes-m3u8-downloader] Installing FFmpeg and FFprobe...');
		await execCommand(`node ${ffmpegPath.replace(/ffmpeg$/, 'install.js')}`);
		console.log('[n8n-nodes-m3u8-downloader] FFmpeg and FFprobe are installed successfully');
	}

	return { ffmpegPath, ffprobePath };
};
