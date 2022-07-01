import { DuplexTable } from "./types"
import {
	ReadableStream, Reader, WritableStream, Writer,
	readBool, readUInt8, readUInt16, readInt32, readUInt32, readDouble, readSpaceOptimizedUInt16, readUtf8String,
	writeBool, writeUInt8, writeUInt16, writeInt32, writeUInt32, writeDouble, writeSpaceOptimizedUInt16, writeUtf8String,
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

export function readImmutableString(stream: ReadableStream) {
	let empty = readBool(stream);
	if (!empty) {
		return readUtf8String(stream);
	}
	return "";
}

export function writeImmutableString(stream: WritableStream, value: string) {
	let empty = !value.length;
	writeBool(stream, empty);
	if (!empty) {
		writeUtf8String(stream, value);
	}
}

export enum PropertyTreeType {
	None,
	Bool,
	Number,
	String,
	List,
	Dictionary,
}

type PropertyTreeValueType = {
	[PropertyTreeType.None]: undefined,
	[PropertyTreeType.Bool]: boolean,
	[PropertyTreeType.Number]: number,
	[PropertyTreeType.String]: string,
	[PropertyTreeType.List]: PropertyTree<PropertyTreeType>[],
	[PropertyTreeType.Dictionary]: PropertyTree<PropertyTreeType>[],
}

const propertyTreeDuplex: DuplexTable<PropertyTreeType, PropertyTreeValueType> = {
	[PropertyTreeType.None]: { read: () => undefined, write: () => {} },
	[PropertyTreeType.Bool]: { read: readBool, write: writeBool },
	[PropertyTreeType.Number]: { read: readDouble, write: writeDouble },
	[PropertyTreeType.String]: { read: readImmutableString, write: writeImmutableString },
	[PropertyTreeType.List]: { read: readPropertyTreeList, write: writePropertyTreeList },
	[PropertyTreeType.Dictionary]: { read: readPropertyTreeList, write: writePropertyTreeList },
};

export class PropertyTree<T extends PropertyTreeType = PropertyTreeType> {
	constructor(
		public type: T,
		public anyTypeFlag: boolean,
		public value: PropertyTreeValueType[T],
		public key: string = "",
	) { }

	static read(stream: ReadableStream) {
		const type: PropertyTreeType = readUInt8(stream);

		return new PropertyTree(
			type,
			readBool(stream),
			propertyTreeDuplex[type].read(stream),
		);
	}

	static write<T extends PropertyTreeType>(stream: WritableStream, tree: PropertyTree<T>) {
		writeUInt8(stream, tree.type);
		writeBool(stream, tree.anyTypeFlag);
		propertyTreeDuplex[tree.type].write(stream, tree.value);
	}
}

function readPropertyTreeList(stream: ReadableStream) {
	let size = readUInt32(stream);
	let items = [];
	for (let i = 0; i < size; i++) {
		let key = readImmutableString(stream);
		let item = PropertyTree.read(stream);
		item.key = key;
		items.push(item);
	}
	return items;
}

function writePropertyTreeList(stream: WritableStream, items: PropertyTree<PropertyTreeType>[]) {
	writeUInt32(stream, items.length);
	for (let item of items) {
		writeImmutableString(stream, item.key);
		PropertyTree.write(stream, item);
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

	static write (stream: WritableStream, direction: Direction) {
		let value = direction.value;
		if (direction.targetValue !== DirectionEnum.None) {
			value += ((direction.targetValue + 1) << 4);
		}
		writeUInt8(stream, value);
	}
}

export class MapPosition {
	constructor(
		public x: number,
		public y: number,
	) { }

	static read(stream: ReadableStream) {
		return new MapPosition(
			readInt32(stream) / 256,
			readInt32(stream) / 256,
		);
	}

	static write(stream: WritableStream, pos: MapPosition) {
		writeInt32(stream, pos.x * 256);
		writeInt32(stream, pos.y * 256);
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
