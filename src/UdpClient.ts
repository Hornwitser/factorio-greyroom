import dgram from "dgram";
import events from "events";
import util from "util";
import { DecodeError, ReadableStream, WritableStream, Readable } from "./stream";
import {
	NetworkMessageType,
	NetworkMessage,
	ConnectionRequest,
	ConnectionRequestReply,
	ConnectionRequestReplyConfirm,
	ConnectionAcceptOrDeny,
	ClientToServerHeartbeat,
	ServerToClientHeartbeat,
	Empty,
} from "./network_message";
import NetworkFrame from "./NetworkFrame";


const NetworkMessageClass = new Map<NetworkMessageType, Readable>([
	// [NetworkMessageType.Ping, ...],
	// [NetworkMessageType.PingReply, ...],
	[NetworkMessageType.ConnectionRequest, ConnectionRequest],
	[NetworkMessageType.ConnectionRequestReply, ConnectionRequestReply],
	[NetworkMessageType.ConnectionRequestReplyConfirm, ConnectionRequestReplyConfirm],
	[NetworkMessageType.ConnectionAcceptOrDeny, ConnectionAcceptOrDeny],
	[NetworkMessageType.ClientToServerHeartbeat, ClientToServerHeartbeat],
	[NetworkMessageType.ServerToClientHeartbeat, ServerToClientHeartbeat],
	// [NetworkMessageType.GetOwnAddress, ...],
	// [NetworkMessageType.GetOwnAddressReply, ...],
	// [NetworkMessageType.NatPunchRequest, ...],
	// [NetworkMessageType.NatPunch, ...],
	// [NetworkMessageType.TransferBlockRequest, ...],
	// [NetworkMessageType.TransferBlock, ...],
	// [NetworkMessageType.RequestForHeartbeatWhenDisconnecting, ...],
	// [NetworkMessageType.LANBroadcast, ...],
	// [NetworkMessageType.GameInformationRequest, ...],
	// [NetworkMessageType.GameInformationRequestReply, ...],
	[NetworkMessageType.Empty, Empty],
]);

interface FragmentData {
	fragments: Buffer[],
	receivedCount: number,
	totalCount?: number,
	finished?: true,
}

declare interface UdpClient {
	on(event: "send_message", listener: (message: NetworkMessage) => void): this,
	on(event: "send_frame", listener: (frame: NetworkFrame) => void): this,
	on(event: "message", listener: (message: NetworkMessage) => void): this,
	on(event: "frame", listener: (frame: NetworkFrame) => void): this,
	on(event: "error", listener: (err: Error) => void): this,
	emit(event: "send_message", message: NetworkMessage): boolean,
	emit(event: "send_frame", frame: NetworkFrame): boolean,
	emit(event: "message", message: NetworkMessage): boolean,
	emit(event: "frame", frame: NetworkFrame): boolean,
	emit(event: "error", err: Error): boolean,
}

class UdpClient extends events.EventEmitter {
	socket: dgram.Socket;
	receivedFragments = new Map<number, FragmentData>();

	constructor() {
		super();
		this.socket = dgram.createSocket("udp4", this.handleFrame.bind(this));
		this.socket.on("error", err => { this.emit("error", err); });
	}

	async connect(address: string, port: number) {
		this.socket.connect(port, address);
		await events.once(this.socket, "connect");
	}

	reset() {
		this.socket.close();
		this.receivedFragments.clear();
	}

	send(message: NetworkMessage) {
		this.emit("send_message", message);
		const messageStream = new WritableStream();
		message.write(messageStream);
		const payload = messageStream.data();

		const frameStream = new WritableStream();
		const frame = new NetworkFrame(message.type, payload);
		this.emit("send_frame", frame);
		frame.write(frameStream);
		this.socket.send(frameStream.data());
	}

	handleFrame(data: Buffer, rinfo: dgram.RemoteInfo) {
		void rinfo;
		const frameStream = new ReadableStream(data);
		let frame;
		try {
			frame = NetworkFrame.read(frameStream);
		} catch (err) {
			if (!(err instanceof DecodeError)) {
				err = new DecodeError(
					`Unexpected error decoding frame: ${err.message}`,
					{ error: err },
				);
			}
			err.frameStream = frameStream;
			err.frameData = data;
			this.emit("error", err);
			return;
		}
		this.emit("frame", frame);

		if (!frame.fragmented) {
			this.decodeMessage(frame.messageType, frame.messageData);
			return;
		}

		let fragmentData = this.receivedFragments.get(frame.messageId);
		if (!fragmentData) {
			fragmentData = {
				fragments: [] as Buffer[],
				receivedCount: 0,
			};
			this.receivedFragments.set(frame.messageId, fragmentData);
		}

		if (fragmentData.finished) {
			return;
		}

		if (frame.lastFragment) {
			fragmentData.totalCount = frame.fragmentNumber + 1;
		}

		if (!fragmentData.fragments[frame.fragmentNumber]) {
			fragmentData.fragments[frame.fragmentNumber] = frame.messageData;
			fragmentData.receivedCount += 1;
		}

		if (fragmentData.totalCount === fragmentData.receivedCount && !fragmentData.finished) {
			let messageData = Buffer.concat(fragmentData.fragments);
			fragmentData.fragments = [];
			fragmentData.finished = true;
			this.decodeMessage(frame.messageType, messageData);
		}
	}

	decodeMessage(messageType: NetworkMessageType, messageData: Buffer) {
		if (!NetworkMessageClass.has(messageType)) {
			this.emit("error", new DecodeError(
				`Undecoded message type: ${NetworkMessageType[messageType]} (${messageType})`,
				{ messageData },
			));
			return;
		}
		const messageStream = new ReadableStream(messageData);
		let message;
		try {
			message = NetworkMessageClass.get(messageType)!.read(messageStream) as NetworkMessage;
		} catch (err) {
			if (!(err instanceof DecodeError)) {
				err = new DecodeError(
					`Unexpected error decoding message: ${err.message}`,
					{ error: err },
				);
			}
			err.messageStream = messageStream;
			err.messageData = messageData;
			this.emit("error", err);
			return;
		}
		if (messageStream.readable) {
			const extraData = messageStream.readBuffer();
			this.emit("error", new DecodeError(
				`Undecoded data after message: ${util.format(extraData)}`,
				{ messageStream: messageStream, message, messageData, extraData },
			));
			return;
		}
		this.emit("message", message);
	}
}

export default UdpClient;
