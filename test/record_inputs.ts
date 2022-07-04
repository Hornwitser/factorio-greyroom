// @ts-nocheck
import child_process from "child_process";
import dgram from "dgram";

import events from "events";
import * as libLink from "@clusterio/lib/link";
import * as libConfig from "@clusterio/lib/config";
import { ConsoleTransport, logger } from "@clusterio/lib/logging";
import * as libLoggingUtils from "@clusterio/lib/logging_utils";

import { InputAction, NetworkMessageType, UdpClient } from "../src";

import ServerInterface from "./ServerInterface";
import spawn from "./spawn";

class ControlConnector extends libLink.WebSocketClientConnector {
	token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ1c2VyIiwidXNlciI6InRlc3QiLCJpYXQiOjE2NDU0MDgyMDJ9.Evc8o5LchFpzNcXkIbLeCa2st2Sd92Cdv-6K770PcAU";
	register() {
		this.sendHandshake("register_control", { token: this.token, agent: "factorio-greyroom", version: "test" });
	}
}

class Control extends libLink.Link {
	events = new events.EventEmitter();
	constructor(connector: ControlConnector) {
		super("control", "master", connector);
		libLink.attachAllMessages(this);
	}

	async prepareDisconnectRequestHandler(message, request) {
		this.connector.setClosing();
		return await super.prepareDisconnectRequestHandler(message, request);
	}

	async debugWsMessageEventHandler() { }

	async slaveUpdateEventHandler() { }

	async instanceUpdateEventHandler(message) {
		this.events.emit("instance_update", message.data);
	}

	async saveListUpdateEventHandler() { }

	async logMessageEventHandler(message) {
		//console.log(message.data.info.level, message.data.info.message);
		this.events.emit("instance_log", message.data.info);
	}

	async accountUpdateEventHandler() { }
}

class UdpProxy extends UdpClient {
	serverAddress: string;
	serverPort: number;
	clientAddress: string;
	clientPort: number;

	constructor() {
		super();
		this.socket.removeAllListeners("message");
		this.socket.on("message", this.handleMessage.bind(this));
		this.socket.on("listening", () => {
			const address = this.socket.address();
			console.log(`Listening on ${address.address}:${address.port}`);
		});
	}

	handleMessage(data: Buffer, rinfo: dgram.RemoteInfo) {
		// Client
		if (rinfo.port !== this.serverPort || rinfo.address !== this.serverAddress) {
			this.clientAddress = rinfo.address;
			this.clientPort = rinfo.port;
			this.socket.send(data, this.serverPort, this.serverAddress);
			this.handleFrame(data, rinfo);

		// Server
		} else {
			this.socket.send(data, this.clientPort, this.clientAddress);
		}
	}

	bind(port: number, serverAddress: string, serverPort: string) {
		this.serverAddress = serverAddress;
		this.serverPort = serverPort;
		this.socket.bind(port, "0.0.0.0");
	}
}


let masterProcess: child_process.ChildProcess | undefined;
let slaveProcess: child_process.ChildProcess | undefined;

const connector = new ControlConnector("http://localhost:18729", 2);
const control = new Control(connector);
const serverInterface = new ServerInterface(control);

const proxy = new UdpProxy();

async function setup() {
	logger.add(new ConsoleTransport({
		level: "info",
		format: new libLoggingUtils.TerminalFormat(),
	}));

	libConfig.finalizeConfigs();
	masterProcess = await spawn("../../node_modules/.bin/clusteriomaster run", /Started master/, true);
	slaveProcess = await spawn("../../node_modules/.bin/clusterioslave run", /Started slave/, true);

	// Wait for cluster to settle
	await new Promise(resolve => setTimeout(resolve, 500));

	await connector.connect();
	await serverInterface.setupServer();
	await serverInterface.createSave();
	await serverInterface.startServer();
	await serverInterface.sendRcon("/c game.speed = 0.25");
}

async function teardown() {
	try {
		proxy.close();
	} catch (err) {
		console.log(err);
	}

	try {
		await serverInterface.stopServer();
		await serverInterface.deleteServer();
	} finally {
		await libLink.messages.prepareDisconnect.send(control);
		await connector.close(1000, "quit");
	}

	if (slaveProcess) {
		slaveProcess.kill("SIGINT");
		await events.once(slaveProcess, "exit");
	}
	if (masterProcess) {
		masterProcess.kill("SIGINT");
		await events.once(masterProcess, "exit");
	}
}

process.on("exit", () => {
	if (slaveProcess) { slaveProcess.kill(); }
	if (masterProcess) { masterProcess.kill(); }
});

let firstSigint: number | undefined;
process.on("SIGINT", () => {
	if (!firstSigint) {
		firstSigint = Date.now();
		console.log("Received SIGINT shutting down");
		teardown().catch(console.log);

	// Ignore duplicate SIGINT by stupid node
	} else if (Date.now() - firstSigint > 500) {
		console.log("Received second SIGINT, terminating");
		process.exit();
	}
});

async function main() {
	await setup();

	let firstTick: number;
	proxy.on("error", (err) => {
		console.log(`// ${err.message}`);
	});
	proxy.on("message", (message, messageData) => {
		if (message.type !== NetworkMessageType.ClientToServerHeartbeat) {
			return;
		}

		for (let tickClosure of message.heartbeat.tickClosures) {
			if (!firstTick) {
				firstTick = tickClosure.updateTick;
			}
			for (let inputAction of tickClosure.inputActions) {
				let action = InputAction.repr(inputAction);
				console.log(`client.sendInTickClosure(offset + ${tickClosure.updateTick - firstTick}, ${action});`);
			}
		}
	})
	proxy.bind(18730, "127.0.0.1", serverInterface.gamePort);
}

main().catch(console.log);
