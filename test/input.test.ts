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

test("receives check crc", done => {
	let force = false;
	let checkCrc = false;
	function check(inputAction: InputAction) {
		if (inputAction.type === InputActionType.ForceFullCRC) { force = true; }
		if (inputAction.type === InputActionType.CheckCRC) { checkCrc = true; }
		if (force && checkCrc) {
			client.off("input_action", check);
			done();
		}
	}

	client.on("input_action", check);
	serverInterface.sendRcon("/c game.force_crc()");
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
	function check(action: SynchronizerAction) {
		if (action.type === SynchronizerActionType.ChangeLatency) {
			// Wait some time to make sure correct input is sent in response by the client.
			setTimeout(done, 100);
			client.off("synchronizer_action", check);
		}
	}
	client.on("synchronizer_action", check);
}, 15e3);

test("start and stop walking input actions", done => {
	function check(input: InputAction) {
		if (input.type === InputActionType.StopWalking) {
			serverInterface.sendRcon(
				"/c rcon.print(serpent.line(game.connected_players[1].position))"
			).then(response => {
				try {
					// Running speed is 0.15 per tick, but positions are rounded to 1/256.
					expect(response).toBe(`{x = 0, y = ${Math.round(0.15 * 256) / 256 * 10}}\n`);
				} finally {
					done();
				}
			});
			client.off("input_action", check)
		}
	}

	client.sendInTickClosure(
		client.updateTick! + client.latency,
		new InputAction(InputActionType.StartWalking, new Direction(DirectionEnum.South))
	);
	client.sendInTickClosure(
		client.updateTick! + client.latency + 10,
		new InputAction(InputActionType.StopWalking),
	);
	client.on("input_action", check);
});
