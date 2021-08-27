import child_process from "child_process";
import path from "path";
import stream from "stream";

class LineSplitter extends stream.Transform {
	_partial?: Buffer;

	_transform(chunk: Buffer, encoding: string, callback: () => void) {
		void encoding;
		if (this._partial) {
			chunk = Buffer.concat([this._partial, chunk]);
			delete this._partial;
		}

		while (chunk.length) {
			let end = chunk.indexOf("\n");
			if (end === -1) {
				this._partial = chunk;
				break;
			}

			let next = end + 1;
			// Eat carriage return as well if present
			if (end >= 1 && chunk[end-1] === "\r".charCodeAt(0)) {
				end -= 1;
			}

			let line = chunk.slice(0, end);
			chunk = chunk.slice(next);
			this.push(line);
		}
		callback();
	}

	_flush(callback: () => void) {
		if (this._partial) {
			this.push(this._partial);
			delete this._partial;
		}
		callback();
	}
}

function spawn(cmd: string, waitFor: RegExp): Promise<child_process.ChildProcess> {
	return new Promise(resolve => {
		let parts = cmd.split(" ");
		let process = child_process.spawn(parts[0], parts.slice(1), { cwd: path.join("test", "clusterio") });
		let stdout = new LineSplitter();
		stdout.on("data", (data: Buffer) => {
			const line = data.toString("utf8");
			if (waitFor.test(line)) {
				resolve(process);
			}
			console.log(line);
		});
		process.stdout.pipe(stdout);
		let stderr = new LineSplitter();
		stderr.on("data", (data: Buffer) => {
			void data;
			console.log(data.toString("utf8"));
		});
		process.stderr.pipe(stderr);
	});
}

declare namespace global {
	var masterProcess: child_process.ChildProcess | undefined;
	var slaveProcess: child_process.ChildProcess | undefined;
}

export default async function setup() {
	global.masterProcess = await spawn("../../node_modules/.bin/clusteriomaster run", /Started master/);
	global.slaveProcess = await spawn("../../node_modules/.bin/clusterioslave run", /SOCKET \| registering slave/);
}

process.on("exit", () => {
	if (global.slaveProcess) { global.slaveProcess.kill(); }
	if (global.masterProcess) { global.masterProcess.kill(); }
});
