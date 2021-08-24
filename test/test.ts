import FactorioClient from "../src/FactorioClient";
import { serverInterface } from "./server_integration";


test("connect to server", async () => {
	let client = new FactorioClient(
		"ConnectToServer",
		serverInterface.coreChecksum,
		serverInterface.prototypeListChecksum,
	);

	const promise = new Promise<void>(resolve => {
		client.on("join_game", () => {
			client.abort();
			resolve();
		});
	})

	await client.connect("localhost", serverInterface.gamePort);
	await promise;
});

