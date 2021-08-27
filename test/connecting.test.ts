import events from "events";
import {
	FactorioClient,
	ConnectionRequest,
	Version,
	ModID,
	ModVersion,
	ClientMultiplayerStateType,
	ReadableStream,
	WritableStream,
	NetworkMessageTypeToClass,
} from "../src";
import { serverInterface } from "./server_integration";

function createClient() {
	let client = new FactorioClient(
		"player",
		serverInterface.coreChecksum,
		serverInterface.prototypeListChecksum,
		serverInterface.activeMods,
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

test("valid connection request", async () => {
	const client = createClient();
	try {
		await client.connect("localhost", serverInterface.gamePort);
	} finally {
		client.abort();
	}
});

describe("invalid connection request", () => {
	let client: FactorioClient;
	beforeEach(() => {
		client = createClient();
	});

	afterEach(async () => {
		client.reset();
	});

	test("mods mismatch", async () => {
		client.playerName = "mods_mismatch";
		client.activeMods = [new ModID("missing", new ModVersion(1, 2, 3), 9)];
		await expect(client.connect("localhost", serverInterface.gamePort)).rejects.toThrow(/ModsMismatch/);
	});
	test("core mod mismatch", async () => {
		client.playerName = "core_mod_mismatch";
		client.coreChecksum = 0;
		await expect(client.connect("localhost", serverInterface.gamePort)).rejects.toThrow(/CoreModMismatch/);
	});
	test.skip("mod startup settings mismatch", async () => {
		// TODO
	});
	test("player limit reached", async () => {
		const altClient = new FactorioClient(
			"player",
			serverInterface.coreChecksum,
			serverInterface.prototypeListChecksum,
			serverInterface.activeMods,
		);
		await altClient.connect("localhost", serverInterface.gamePort);
		await serverInterface.sendRcon("/config set max-players 1");
		try {
			client.playerName = "player_limit_reached";
			await expect(client.connect("localhost", serverInterface.gamePort)).rejects.toThrow(/PlayerLimitReached/);
		} finally {
			altClient.abort();
			await serverInterface.sendRcon("/config set max-players 0");
		}
	});
	test("prototype checksum mismatch", async () => {
		client.playerName = "prototype_checksum_mismatch";
		client.prototypeListChecksum = 0;
		await expect(
			client.connect("localhost", serverInterface.gamePort)
		).rejects.toThrow(/PrototypeChecksumMismatch/);
	});
	test("password missing", async () => {
		await serverInterface.sendRcon("/config set password 12345");
		try {
			client.playerName = "password_missing";
			await expect(client.connect("localhost", serverInterface.gamePort)).rejects.toThrow(/PasswordMissing/);
		} finally {
			await serverInterface.sendRcon("/config set password");
		}
	});
	test("password mismatch", async () => {
		await serverInterface.sendRcon("/config set password 12345");
		try {
			client.playerName = "password_missing";
			client.password = "abc";
			await expect(client.connect("localhost", serverInterface.gamePort)).rejects.toThrow(/PasswordMismatch/);
		} finally {
			await serverInterface.sendRcon("/config set password");
		}
	});
	test.skip("user verification missing", async () => {
		// TODO
	});
	test.skip("user verification ", async () => {
		// TODO
	});
	test.skip("user verification missing", async () => {
		// TODO
	});
	test("user banned", async () => {
		await serverInterface.sendRcon("/ban user_banned");
		client.playerName = "user_banned";
		client.password = "abc";
		await expect(client.connect("localhost", serverInterface.gamePort)).rejects.toThrow(/UserBanned/);
	});
	test("address used for different player", async () => {
		client.playerName = "player",
		await client.connect("localhost", serverInterface.gamePort);

		client.playerName = "address_used_for_different_player",
		client.state = ClientMultiplayerStateType.Connecting;
		clearInterval(client.heartbeatInterval!);
		client.clientRequestID = Math.round(Math.random() * 2 ** 32);
		const request = new ConnectionRequest(new Version(0, 0, 0, 0), client.clientRequestID);
		client.connection.send(request);
		await expect(events.once(client, "join_game")).rejects.toThrow(/AddressUsedForDifferentPlayer/);
	});
	test("user with that name already in game", async () => {
		client.playerName = "<server>",
		await expect(
			client.connect("localhost", serverInterface.gamePort)
		).rejects.toThrow(/UserWithThatNameAlreadyInGame/);
	});
	test("user not whitelisted", async () => {
		await serverInterface.sendRcon("/whitelist add whitelisted");
		await serverInterface.sendRcon("/whitelist enable");
		try {
			client.playerName = "user_not_whitelisted";
			await expect(client.connect("localhost", serverInterface.gamePort)).rejects.toThrow(/UserNotWhitelisted/);
		} finally {
			await serverInterface.sendRcon("/whitelist clear");
		}
	});
});
