import child_process from "child_process";

import spawn from "./spawn";


declare namespace global {
	var masterProcess: child_process.ChildProcess | undefined;
	var slaveProcess: child_process.ChildProcess | undefined;
}

export default async function setup() {
	global.masterProcess = await spawn("../../node_modules/.bin/clusteriomaster run", /Started master/);
	global.slaveProcess = await spawn("../../node_modules/.bin/clusterioslave run", /Started slave/);
}

process.on("exit", () => {
	if (global.slaveProcess) { global.slaveProcess.kill(); }
	if (global.masterProcess) { global.masterProcess.kill(); }
});
