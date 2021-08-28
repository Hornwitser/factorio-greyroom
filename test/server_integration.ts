// @ts-nocheck
import events from "events";
import * as libLink from "@clusterio/lib/link";
import * as libConfig from "@clusterio/lib/config";
import { ConsoleTransport, logger } from "@clusterio/lib/logging";
import * as libLoggingUtils from "@clusterio/lib/logging_utils";

import {
	FactorioClient,
	ReadableStream,
	WritableStream,
	NetworkMessageTypeToClass,
	ModID,
	ModVersion,
} from "../src";


const mapGenSettings = {
	terrain_segmentation: 1,
	water: 1,
	autoplace_controls: {
		"coal": { frequency: 1, size: 1, richness: 1 },
		"copper-ore": { frequency: 1, size: 1, richness: 1 },
		"crude-oil": { frequency: 1, size: 1, richness: 1 },
		"enemy-base": { frequency: 1, size: 1, richness: 1 },
		"iron-ore": { frequency: 1, size: 1, richness: 1 },
		"stone": { frequency: 1, size: 1, richness: 1 },
		"trees": { frequency: 1, size: 1, richness: 1 },
		"uranium-ore": { frequency: 1, size: 1, richness: 1 }
	},
	autoplace_settings: {},
	default_enable_all_autoplace_controls: true,
	seed: 1207360873,
	// Width and height of 50 is a "debug map" and skips the intro.
	width: 50,
	height: 50,
	starting_area: 1,
	peaceful_mode: false,
	starting_points: [{ x: 0, y: 0 }],
	property_expression_names: {},
	cliff_settings: {
		name: "cliff",
		elevation_0: 10,
		elevation_interval: 40,
		richness: 1
	}
};


logger.add(new ConsoleTransport({
	level: "info",
	format: new libLoggingUtils.TerminalFormat(),
}));
libConfig.finalizeConfigs();

class TestControlConnector extends libLink.WebSocketClientConnector {
	token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ1c2VyIiwidXNlciI6InRlc3QiLCJpYXQiOjE2Mjk3NzAxMTV9.U0ji6GMERmjz9JD4IZNI64DnhZb61yAW3QTuPKP9HpM";
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
}

export class ServerInterface {
	instanceId = 0;
	gamePort = 0;
	coreChecksum = 0;
	baseChecksum = 0;
	baseVersion = new ModVersion(0, 0, 0);
	prototypeListChecksum = 0;
	status = "unknown";
	constructor(
		public control: TestControl,
	) {
		control.events.on("instance_update", data => {
			this.status = data.status;
		});

		control.events.on("instance_log", info => {
			if (info.parsed) {
				let match = /Checksum for core: (\d+)/.exec(info.parsed.message);
				if (match) {
					this.coreChecksum = Number(match[1]);
				}

				match = /Checksum of base: (\d+)/.exec(info.parsed.message);
				if (match) {
					this.baseChecksum = Number(match[1]);
				}

				match = /Loading mod base (\d+)\.(\d+)\.(\d+)/.exec(info.parsed.message);
				if (match) {
					this.baseVersion = new ModVersion(Number(match[1]), Number(match[2]), Number(match[3]));
				}

				match = /Prototype list checksum: (\d+)/.exec(info.parsed.message);
				if (match) {
					this.prototypeListChecksum = Number(match[1]);
				}
			}
		});
	}

	get activeMods() {
		return [new ModID("base", this.baseVersion, this.baseChecksum)];
	}

	createClient() {
		let client = new FactorioClient(
			"player",
			this.coreChecksum,
			this.prototypeListChecksum,
			this.activeMods,
		);
		// Validate that data types used round trip serialize
		client.connection.on("send_message", (message, data) => {
			const messageStream = new ReadableStream(data);
			const decodedMessage = NetworkMessageTypeToClass.get(message.type)!.read(messageStream);
			expect(decodedMessage).toEqual(message);
		});
		client.connection.on("message", (message, data) => {
			const messageStream = new WritableStream();
			message.write(messageStream);
			expect(messageStream.data()).toEqual(data);
		});
		return client;
	}

	async setupServer() {
		const instanceConfig = new libConfig.InstanceConfig("control");
		await instanceConfig.init();
		this.instanceId = instanceConfig.get("instance.id");
		instanceConfig.set("instance.name", String(this.instanceId));
		this.gamePort = Math.floor(Math.random() * (65536 - 49152) + 49152);
		instanceConfig.set("factorio.game_port", this.gamePort);
		instanceConfig.setProp("factorio.settings", "name", String(this.instanceId));
		instanceConfig.setProp("factorio.settings", "visibility", { public: false, lan: true });
		instanceConfig.setProp("factorio.settings", "require_user_verification", false );
		let serialized_config = instanceConfig.serialize("master");
		await libLink.messages.createInstance.send(this.control, { serialized_config });
		await libLink.messages.assignInstanceCommand.send(this.control, { instance_id: this.instanceId, slave_id: 1 });
		await libLink.messages.setInstanceSubscriptions.send(this.control, {
			all: false, instance_ids: [this.instanceId]
		});
		await libLink.messages.setLogSubscriptions.send(this.control, {
			all: false, master: false, slave_ids: [], instance_ids: [this.instanceId], max_level: "server" }
		);
	}

	async createSave() {
		await libLink.messages.createSave.send(this.control, {
			instance_id: this.instanceId,
			name: "world.zip",
			seed: null,
			map_gen_settings: mapGenSettings,
			map_settings: null,
		});
	}

	async startServer() {
		await libLink.messages.startInstance.send(this.control, { instance_id: this.instanceId, save: null });
	}

	async stopServer() {
		await libLink.messages.stopInstance.send(this.control, { instance_id: this.instanceId });
	}

	async deleteServer() {
		await libLink.messages.deleteInstance.send(this.control, { instance_id: this.instanceId });
	}

	async sendRcon(command: string) {
		let response = await libLink.messages.sendRcon.send(this.control, { instance_id: this.instanceId, command });
		return response.result;
	}
}

const connector = new TestControlConnector("http://localhost:18729", 2);
export const control = new TestControl(connector);
export const serverInterface = new ServerInterface(control);

beforeAll(async () => {
	await connector.connect();
	await serverInterface.setupServer();
	await serverInterface.createSave();
	await serverInterface.startServer();
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
