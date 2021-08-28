import { DisconnectReason } from "./data";
import { ConnectionRequestStatus } from "./network_message";

export class ConnectingFailed extends Error {
	code = "CONNECTION_FAILED";
	constructor(
		message: string,
		public reason: ConnectionRequestStatus,
	) {
		super(message);
	}
}

export class Disconnected extends Error {
	code = "DISCONNECTED";
	constructor(
		message: string,
		public reason: DisconnectReason,
	) {
		super(message);
	}
}
