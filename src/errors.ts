import { ConnectionRequestStatus, } from "./network_message";

export class ConnectingFailed extends Error {
	code = "CONNECTION_FAILED";
	constructor(
		message: string,
		public reason: ConnectionRequestStatus,
	) {
		super(message);
	}
}

