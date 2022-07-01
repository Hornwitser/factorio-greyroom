// @ts-nocheck
import events from "events";
import * as libLink from "@clusterio/lib/link";
import * as libConfig from "@clusterio/lib/config";
import { ConsoleTransport, logger } from "@clusterio/lib/logging";
import * as libLoggingUtils from "@clusterio/lib/logging_utils";

import ServerInterface from "./ServerInterface";


logger.add(new ConsoleTransport({
	level: "info",
	format: new libLoggingUtils.TerminalFormat(),
}));
libConfig.finalizeConfigs();

class TestControlConnector extends libLink.WebSocketClientConnector {
	token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ1c2VyIiwidXNlciI6InRlc3QiLCJpYXQiOjE2NDU0MDgyMDJ9.Evc8o5LchFpzNcXkIbLeCa2st2Sd92Cdv-6K770PcAU";
	register() {
		this.sendHandshake("register_control", { token: this.token, agent: "factorio-greyroom", version: "test" });
	}
}


class TestControl extends libLink.Link {
	events = new events.EventEmitter();
	constructor(connector: TestControlConnector) {
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

const connector = new TestControlConnector("http://localhost:18729", 2);
export const control = new TestControl(connector);
export const serverInterface = new ServerInterface(control);

beforeAll(async () => {
	await connector.connect();
	await serverInterface.setupServer();
	await serverInterface.createSave();
	await serverInterface.startServer();
	await serverInterface.sendRcon("/c game.speed = 5")
});

afterAll(async () => {
	try {
		await serverInterface.stopServer();
		await serverInterface.deleteServer();
	} finally {
		await libLink.messages.prepareDisconnect.send(control);
		await connector.close(1000, "quit");
	}
});
