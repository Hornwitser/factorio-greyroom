import child_process from "child_process";
import events from "events";

declare namespace global {
	var masterProcess: child_process.ChildProcess | undefined;
	var slaveProcess: child_process.ChildProcess | undefined;
}

export default async function teardown() {
	if (global.slaveProcess) {
		global.slaveProcess.kill("SIGINT");
		await events.once(global.slaveProcess, "exit");
		delete global.slaveProcess
	}
	if (global.masterProcess) {
		global.masterProcess.kill("SIGINT");
		await events.once(global.masterProcess, "exit");
		delete global.masterProcess;
	}
}
