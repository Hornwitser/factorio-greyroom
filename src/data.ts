import { ReadableStream, WritableStream } from "./stream";

export class Version {
	constructor(
		public major: number,
		public minor: number,
		public patch: number,
		public build: number,
	) { }

	static read(stream: ReadableStream) {
		return new Version(
			stream.readUInt8(),
			stream.readUInt8(),
			stream.readUInt8(),
			stream.readUInt16(),
		);
	}

	write(stream: WritableStream) {
		stream.writeUInt8(this.major);
		stream.writeUInt8(this.minor);
		stream.writeUInt8(this.patch);
		stream.writeUInt16(this.build);
	}
}

export class ModVersion {
	constructor(
		public major: number,
		public minor: number,
		public sub: number,
	) { }

	static read(stream: ReadableStream) {
		return new ModVersion(
			stream.readSpaceOptimizedUInt16(),
			stream.readSpaceOptimizedUInt16(),
			stream.readSpaceOptimizedUInt16(),
		);
	}

	write(stream: WritableStream) {
		stream.writeSpaceOptimizedUInt16(this.major);
		stream.writeSpaceOptimizedUInt16(this.minor);
		stream.writeSpaceOptimizedUInt16(this.sub);
	}
}

export class ModID {
	constructor(
		public name: string,
		public version: ModVersion,
		public crc: number,
	) { }

	static read(stream: ReadableStream) {
		return new ModID(
			stream.readUtf8String(),
			ModVersion.read(stream),
			stream.readUInt32(),
		);
	}

	write(stream: WritableStream) {
		stream.writeUtf8String(this.name);
		this.version.write(stream);
		stream.writeUInt32(this.crc);
	}
}

export class ModStartupSetting {
	static read(stream: ReadableStream) {
		stream.readUInt8();
		return new ModStartupSetting();
	}

	write(stream: WritableStream) {
		stream.writeUInt8(0);
	}
}


export enum DirectionEnum {
	North,
	NorthEast,
	East,
	SouthEast,
	South,
	SouthWest,
	West,
	NorthWest,
	None,
}

export class Direction {
	constructor(
		public value: DirectionEnum,
		public targetValue = DirectionEnum.None,
	) { }

	static read(stream: ReadableStream) {
		const readValue = stream.readUInt8();
		let targetValue = DirectionEnum.None;
		if (readValue > 15) {
			targetValue = (readValue >> 4) - 1;
		}
		return new Direction(
			readValue & 15,
			targetValue,
		);
	}

	write (stream: WritableStream) {
		let value = this.value;
		if (this.targetValue !== DirectionEnum.None) {
			value += ((this.targetValue + 1) << 4);
		}
		stream.writeUInt8(value);
	}
}


export enum DisconnectReason {
	Quit,
	Dropped,
	Reconnect,
	WrongInput,
	DesyncLimitReached,
	CantKeepUp,
	AFK,
	Kicked,
	KickedAndDeleted,
	Banned,
	SwitchingServers,
}


export type SmallProgress = number | null;
export function readSmallProgress(stream: ReadableStream): SmallProgress {
	const value = stream.readUInt8();
	return value === 255 ? null : value / 254;
}

export function writeSmallProgress(progress: SmallProgress, stream: WritableStream) {
	stream.writeUInt8(progress === null ? 255 : Math.floor(progress * 254));
}
