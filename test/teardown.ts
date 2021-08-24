import child_process from "child_process";
import events from "events";

declare namespace global {
	var masterProcess: child_process.ChildProcess;
	var slaveProcess: child_process.ChildProcess;
}

export default async function setup() {
	global.slaveProcess.kill("SIGINT");
	await events.once(global.slaveProcess, "exit");
	global.masterProcess.kill("SIGINT");
	await events.once(global.masterProcess, "exit");
}
