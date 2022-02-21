import dgram from "dgram";
import events from "events";
import util from "util";
import { DecodeError, ReadableStream, WritableStream } from "./stream";
import {
	NetworkMessageType,
	NetworkMessage,
	NetworkMessageTypeToClass,
} from "./network_message";
import NetworkFrame from "./NetworkFrame";


interface FragmentData {
	fragments: Buffer[],
	receivedCount: number,
	totalCount?: number,
	finished?: true,
}

declare interface UdpClient {
	on(event: "send_message", listener: (message: NetworkMessage, data: Buffer) => void): this,
	on(event: "send_frame", listener: (frame: NetworkFrame, data: Buffer) => void): this,
	on(event: "message", listener: (message: NetworkMessage, data: Buffer) => void): this,
	on(event: "frame", listener: (frame: NetworkFrame, data: Buffer) => void): this,
	on(event: "close", listener: () => void): this,
	on(event: "error", listener: (err: Error) => void): this,
	emit(event: "send_message", message: NetworkMessage, data: Buffer): boolean,
	emit(event: "send_frame", frame: NetworkFrame, data: Buffer): boolean,
	emit(event: "message", message: NetworkMessage, data: Buffer): boolean,
	emit(event: "frame", frame: NetworkFrame, data: Buffer): boolean,
	emit(event: "close"): boolean,
	emit(event: "error", err: Error): boolean,
}

class UdpClient extends events.EventEmitter {
	socket: dgram.Socket;
	connected = false;
	receivedFragments = new Map<number, FragmentData>();

	constructor() {
		super();
		this.socket = dgram.createSocket("udp4", this.handleFrame.bind(this));
		this.socket.on("connect", () => { this.connected = true; });
		this.socket.on("close", () => { this.emit("close"); });
		this.socket.on("error", err => { this.emit("error", err); });
	}

	async connect(address: string, port: number) {
		this.socket.connect(port, address);
		await events.once(this.socket, "connect");
	}

	reset() {
		if (this.connected) {
			this.socket.disconnect();
			this.connected = false;
		}
		this.receivedFragments = new Map();
	}

	close() {
		this.reset();
		this.socket.close();
	}

	send(message: NetworkMessage) {
		const messageStream = new WritableStream();
		message.write(messageStream);
		const payload = messageStream.data();
		this.emit("send_message", message, payload);

		const frameStream = new WritableStream();
		const frame = new NetworkFrame(message.type, payload);
		frame.write(frameStream);
		const frameData = frameStream.data();
		this.emit("send_frame", frame, frameData);
		this.socket.send(frameData);
	}

	handleFrame(data: Buffer, rinfo: dgram.RemoteInfo) {
		void rinfo;
		const frameStream = new ReadableStream(data);
		let frame;
		try {
			frame = NetworkFrame.read(frameStream);
		} catch (err: any) {
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
		this.emit("frame", frame, data);

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
		if (!NetworkMessageTypeToClass.has(messageType)) {
			this.emit("error", new DecodeError(
				`Undecoded message type: ${NetworkMessageType[messageType]} (${messageType})`,
				{ messageData },
			));
			return;
		}
		const messageStream = new ReadableStream(messageData);
		let message;
		try {
			message = NetworkMessageTypeToClass.get(messageType)!.read(messageStream) as NetworkMessage;
		} catch (err: any) {
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
		this.emit("message", message, messageData);
	}
}

export default UdpClient;
