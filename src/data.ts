import {
	ReadableStream, WritableStream,
	readUInt8, readUInt16, readUInt32, readSpaceOptimizedUInt16, readUtf8String,
	writeUInt8, writeUInt16, writeUInt32, writeSpaceOptimizedUInt16, writeUtf8String,
} from "./stream";

export class Version {
	constructor(
		public major: number,
		public minor: number,
		public patch: number,
		public build: number,
	) { }

	static read(stream: ReadableStream) {
		return new Version(
			readUInt8(stream),
			readUInt8(stream),
			readUInt8(stream),
			readUInt16(stream),
		);
	}

	static write(stream: WritableStream, version: Version) {
		writeUInt8(stream, version.major);
		writeUInt8(stream, version.minor);
		writeUInt8(stream, version.patch);
		writeUInt16(stream, version.build);
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
			readSpaceOptimizedUInt16(stream),
			readSpaceOptimizedUInt16(stream),
			readSpaceOptimizedUInt16(stream),
		);
	}

	static write(stream: WritableStream, version: ModVersion) {
		writeSpaceOptimizedUInt16(stream, version.major);
		writeSpaceOptimizedUInt16(stream, version.minor);
		writeSpaceOptimizedUInt16(stream, version.sub);
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
			readUtf8String(stream),
			ModVersion.read(stream),
			readUInt32(stream),
		);
	}

	static write(stream: WritableStream, modID: ModID) {
		writeUtf8String(stream, modID.name);
		ModVersion.write(stream, modID.version);
		writeUInt32(stream, modID.crc);
	}
}

export class ModStartupSetting {
	static read(stream: ReadableStream) {
		readUInt8(stream);
		return new ModStartupSetting();
	}

	static write(stream: WritableStream, setting: ModStartupSetting) {
		writeUInt8(stream, 0);
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
		const readValue = readUInt8(stream);
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
		writeUInt8(stream, value);
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
	const value = readUInt8(stream);
	return value === 255 ? null : value / 254;
}

export function writeSmallProgress(stream: WritableStream, progress: SmallProgress) {
	writeUInt8(stream, progress === null ? 255 : Math.floor(progress * 254));
}
