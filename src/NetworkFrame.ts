import { NetworkMessageType } from "./network_message";
import {
	Readable, Writable,
	UInt8, UInt16, BufferT,
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

	static read(stream: Readable) {
		const flags = UInt8.read(stream);
		const messageType = flags & 0x1f;
		const random = Boolean(flags & 0x20);
		const fragmented = Boolean(flags & 0x40);
		const lastFragment = Boolean(flags & 0x80);

		let messageId = 0;
		let fragmentNumber = 0;
		let confirmRecords: [number, number][] = [];
		if (fragmented || alwaysHasMessageIdTypes.get(messageType)) {
			const messageIdAndConfirmFlag = UInt16.read(stream);
			messageId = messageIdAndConfirmFlag & 0x7fff;
			const hasConfirm = Boolean(messageIdAndConfirmFlag & 0x8000);

			if (fragmented) {
				fragmentNumber = UInt8.read(stream);
			}

			if (hasConfirm) {
				let confirmCount = UInt8.read(stream);
				for (let i = 0; i < confirmCount; i++) {
					confirmRecords.push([UInt16.read(stream), UInt16.read(stream)]);
				}
			}
		}

		let messageData = BufferT.read(stream);
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

	write(stream: Writable) {
		let flags = this.messageType;
		flags |= Number(this.random) * 0x20;
		flags |= Number(this.fragmented) * 0x40;
		flags |= Number(this.lastFragment) * 0x80;
		UInt8.write(stream, flags);

		if (this.fragmented || alwaysHasMessageIdTypes.get(this.messageType)) {
			const hasConfirm = this.confirmRecords.length > 0;
			UInt16.write(stream, this.messageId | Number(hasConfirm) * 0x8000);

			if (this.fragmented) {
				UInt8.write(stream, this.fragmentNumber);
			}

			if (hasConfirm) {
				UInt8.write(stream, this.confirmRecords.length);
				for (let confirmRecord of this.confirmRecords) {
					UInt16.write(stream, confirmRecord[0]);
					UInt16.write(stream, confirmRecord[1]);
				}
			}
		}

		BufferT.write(stream, this.messageData);
	}
}

