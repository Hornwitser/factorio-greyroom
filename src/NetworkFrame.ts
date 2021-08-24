import { NetworkMessageType } from "./network_message";
import type { WritableStream, ReadableStream } from "./stream";


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
		const flags = stream.readUInt8();
		const messageType = flags & 0x1f;
		const random = Boolean(flags & 0x20);
		const fragmented = Boolean(flags & 0x40);
		const lastFragment = Boolean(flags & 0x80);

		let messageId = 0;
		let fragmentNumber = 0;
		let confirmRecords: [number, number][] = [];
		if (fragmented || alwaysHasMessageIdTypes.get(messageType)) {
			const messageIdAndConfirmFlag = stream.readUInt16();
			messageId = messageIdAndConfirmFlag & 0x7fff;
			const hasConfirm = Boolean(messageIdAndConfirmFlag & 0x8000);

			if (fragmented) {
				fragmentNumber = stream.readUInt8();
			}

			if (hasConfirm) {
				let confirmCount = stream.readUInt8();
				for (let i = 0; i < confirmCount; i++) {
					confirmRecords.push([stream.readUInt16(), stream.readUInt16()]);
				}
			}
		}

		let messageData = stream.readBuffer();
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
		stream.writeUInt8(flags);

		if (this.fragmented || alwaysHasMessageIdTypes.get(this.messageType)) {
			const hasConfirm = this.confirmRecords.length > 0;
			stream.writeUInt16(this.messageId | Number(hasConfirm) * 0x8000);

			if (this.fragmented) {
				stream.writeUInt8(this.fragmentNumber);
			}

			if (hasConfirm) {
				stream.writeUInt8(this.confirmRecords.length);
				for (let confirmRecord of this.confirmRecords) {
					stream.writeUInt16(confirmRecord[0]);
					stream.writeUInt16(confirmRecord[1]);
				}
			}
		}

		stream.writeBuffer(this.messageData);
	}
}

