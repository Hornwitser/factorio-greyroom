import { NetworkMessageType } from "./network_message";
import {
	ReadableStream, WritableStream,
	readUInt8, readUInt16, readBuffer, writeUInt8, writeUInt16, writeBuffer
} from "./stream";


const alwaysHasMessageIdTypes = new Map([
	[NetworkMessageType.ConnectionRequest, true],
	[NetworkMessageType.ConnectionRequestReplyConfirm, true],
]);

export default class NetworkFrame {
	constructor(
		public messageType: NetworkMessageType,
		public messageData: Buffer,
		public random: boolean = Math.random() > 0.5,
		public fragmented: boolean = false,
		public lastFragment: boolean = false,
		public messageId: number = 0,
		public fragmentNumber: number = 0,
		public confirmRecords: [number, number][] = [],
	) { }

	static read(stream: ReadableStream) {
		const flags = readUInt8(stream);
		const messageType = flags & 0x1f;
		const random = Boolean(flags & 0x20);
		const fragmented = Boolean(flags & 0x40);
		const lastFragment = Boolean(flags & 0x80);

		let messageId = 0;
		let fragmentNumber = 0;
		let confirmRecords: [number, number][] = [];
		if (fragmented || alwaysHasMessageIdTypes.get(messageType)) {
			const messageIdAndConfirmFlag = readUInt16(stream);
			messageId = messageIdAndConfirmFlag & 0x7fff;
			const hasConfirm = Boolean(messageIdAndConfirmFlag & 0x8000);

			if (fragmented) {
				fragmentNumber = readUInt8(stream);
			}

			if (hasConfirm) {
				let confirmCount = readUInt8(stream);
				for (let i = 0; i < confirmCount; i++) {
					confirmRecords.push([readUInt16(stream), readUInt16(stream)]);
				}
			}
		}

		let messageData = readBuffer(stream);
		return new NetworkFrame(
			messageType,
			messageData,
			random,
			fragmented,
			lastFragment,
			messageId,
			fragmentNumber,
			confirmRecords,
		);
	}

	write(stream: WritableStream) {
		let flags = this.messageType;
		flags |= Number(this.random) * 0x20;
		flags |= Number(this.fragmented) * 0x40;
		flags |= Number(this.lastFragment) * 0x80;
		writeUInt8(stream, flags);

		if (this.fragmented || alwaysHasMessageIdTypes.get(this.messageType)) {
			const hasConfirm = this.confirmRecords.length > 0;
			writeUInt16(stream, this.messageId | Number(hasConfirm) * 0x8000);

			if (this.fragmented) {
				writeUInt8(stream, this.fragmentNumber);
			}

			if (hasConfirm) {
				writeUInt8(stream, this.confirmRecords.length);
				for (let confirmRecord of this.confirmRecords) {
					writeUInt16(stream, confirmRecord[0]);
					writeUInt16(stream, confirmRecord[1]);
				}
			}
		}

		writeBuffer(stream, this.messageData);
	}
}

