import {
	FactorioClient,
	InputActionType,
	InputAction,
	SynchronizerActionType,
	SynchronizerAction,
	DirectionEnum,
	Direction,
	Disconnected,
} from "../src";
import { serverInterface } from "./server_integration";


let client: FactorioClient;
beforeEach(async () => {
	client = serverInterface.createClient();
	await client.connect("localhost", serverInterface.gamePort);
});

afterEach(async () => {
	client.close();
});

function waitForInput(type: InputActionType) {
	return new Promise<InputAction>(resolve => {
		function check(inputAction: InputAction) {
			if (inputAction.type === type) {
				client.off("input_action", check);
				resolve(inputAction);
			}
		}
		client.on("input_action", check)
	});
}

test("receives check crc heuristics", done => {
	function check() {
		const serverTickClosure = client.tickClosuresReceived.get(client.updateTick!)!;
		for (let inputAction of serverTickClosure.inputActions) {
			if (inputAction.type === InputActionType.CheckCRCHeuristic) {
				client.off("tick", check);
				done();
			}
		}
	}

	client.on("tick", check);
});

test("receives check crc", () => {
	return Promise.all([
		waitForInput(InputActionType.ForceFullCRC),
		waitForInput(InputActionType.CheckCRC),
		serverInterface.sendRcon("/c game.force_crc()"),
	]);
});

test("disconnects on wrong player index", done => {
	client.on("error", err => {
		expect(err).toBeInstanceOf(Disconnected);
		expect(err.message).toMatch(/WrongInput/);
		done();
	});
	client.sendInNextTickClosure(
		new InputAction(InputActionType.StopWalking, undefined, 2 ** 16 - 1)
	);
});

test("handles latency change", done => {
	client.on("tick", () => {
		if (client.playerIndex === null) {
			return;
		}
		client.sendInNextTickClosure(
			new InputAction(InputActionType.ClearCursor),
		);
	});
	function check(action: SynchronizerAction) {
		if (action.type === SynchronizerActionType.ChangeLatency) {
			// Wait some time to make sure correct input is sent in response by the client.
			setTimeout(done, 100);
			client.off("synchronizer_action", check);
		}
	}
	client.on("synchronizer_action", check);
}, 15e3);

test("start and stop walking input actions", async () => {
	let offset = client.updateTick! + client.latency;
	client.sendInTickClosure(offset, new InputAction(InputActionType.StartWalking, new Direction(DirectionEnum.South)));
	client.sendInTickClosure(offset + 10, new InputAction(InputActionType.StopWalking));

	await waitForInput(InputActionType.StopWalking);
	expect(await serverInterface.sendRcon(
		"/c rcon.print(serpent.line(game.connected_players[1].position))"
	// Running speed is 0.15 per tick, but positions are rounded to 1/256.
	)).toBe(`{x = 0, y = ${Math.round(0.15 * 256) / 256 * 10}}\n`);
});
