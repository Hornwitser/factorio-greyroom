import {
	Readable, Duplexer, DuplexerLookupTable, Writable,
} from "./stream";
import {
	Bool, UInt8, UInt16, Int32, UInt32, Double, SpaceOptimizedUInt16, Utf8String,
} from "./types";

export class Version {
	constructor(
		public major: number,
		public minor: number,
		public patch: number,
		public build: number,
	) { }

	static read(stream: Readable) {
		return new Version(
			UInt8.read(stream),
			UInt8.read(stream),
			UInt8.read(stream),
			UInt16.read(stream),
		);
	}

	static write(stream: Writable, version: Version) {
		UInt8.write(stream, version.major);
		UInt8.write(stream, version.minor);
		UInt8.write(stream, version.patch);
		UInt16.write(stream, version.build);
	}
}

export class ModVersion {
	constructor(
		public major: number,
		public minor: number,
		public sub: number,
	) { }

	static read(stream: Readable) {
		return new ModVersion(
			SpaceOptimizedUInt16.read(stream),
			SpaceOptimizedUInt16.read(stream),
			SpaceOptimizedUInt16.read(stream),
		);
	}

	static write(stream: Writable, version: ModVersion) {
		SpaceOptimizedUInt16.write(stream, version.major);
		SpaceOptimizedUInt16.write(stream, version.minor);
		SpaceOptimizedUInt16.write(stream, version.sub);
	}
}

export class ModID {
	constructor(
		public name: string,
		public version: ModVersion,
		public crc: number,
	) { }

	static read(stream: Readable) {
		return new ModID(
			Utf8String.read(stream),
			ModVersion.read(stream),
			UInt32.read(stream),
		);
	}

	static write(stream: Writable, modID: ModID) {
		Utf8String.write(stream, modID.name);
		ModVersion.write(stream, modID.version);
		UInt32.write(stream, modID.crc);
	}
}

export type ImmutableString = string;
export const ImmutableString: Duplexer<ImmutableString> = {
	read(stream: Readable) {
		let empty = Bool.read(stream);
		if (!empty) {
			return Utf8String.read(stream);
		}
		return "";
	},
	write(stream: Writable, value: string) {
		let empty = !value.length;
		Bool.write(stream, empty);
		if (!empty) {
			Utf8String.write(stream, value);
		}
	},
}

const PropertyTreeList = {
	read(stream: Readable) {
		let size = UInt32.read(stream);
		let items = [];
		for (let i = 0; i < size; i++) {
			let key = ImmutableString.read(stream);
			let item = PropertyTree.read(stream);
			item.key = key;
			items.push(item);
		}
		return items;
	},
	write(stream: Writable, items: PropertyTree<PropertyTreeType>[]) {
		UInt32.write(stream, items.length);
		for (let item of items) {
			ImmutableString.write(stream, item.key);
			PropertyTree.write(stream, item);
		}
	},
};

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

const PropertyTreeValueType: DuplexerLookupTable<PropertyTreeType, PropertyTreeValueType> = {
	[PropertyTreeType.None]: { read: () => undefined, write: () => {} },
	[PropertyTreeType.Bool]: Bool,
	[PropertyTreeType.Number]: Double,
	[PropertyTreeType.String]: ImmutableString,
	[PropertyTreeType.List]: PropertyTreeList,
	[PropertyTreeType.Dictionary]: PropertyTreeList,
};

export class PropertyTree<T extends PropertyTreeType = PropertyTreeType> {
	constructor(
		public type: T,
		public anyTypeFlag: boolean,
		public value: PropertyTreeValueType[T],
		public key: string = "",
	) { }

	static read(stream: Readable) {
		const type: PropertyTreeType = UInt8.read(stream);

		return new PropertyTree(
			type,
			Bool.read(stream),
			PropertyTreeValueType[type].read(stream),
		);
	}

	static write<T extends PropertyTreeType>(stream: Writable, tree: PropertyTree<T>) {
		UInt8.write(stream, tree.type);
		Bool.write(stream, tree.anyTypeFlag);
		PropertyTreeValueType[tree.type].write(stream, tree.value);
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

	static read(stream: Readable) {
		const readValue = UInt8.read(stream);
		let targetValue = DirectionEnum.None;
		if (readValue > 15) {
			targetValue = (readValue >> 4) - 1;
		}
		return new Direction(
			readValue & 15,
			targetValue,
		);
	}

	static write (stream: Writable, direction: Direction) {
		let value = direction.value;
		if (direction.targetValue !== DirectionEnum.None) {
			value += ((direction.targetValue + 1) << 4);
		}
		UInt8.write(stream, value);
	}
}

export class MapPosition {
	constructor(
		public x: number,
		public y: number,
	) { }

	static read(stream: Readable) {
		return new MapPosition(
			Int32.read(stream) / 256,
			Int32.read(stream) / 256,
		);
	}

	static write(stream: Writable, pos: MapPosition) {
		Int32.write(stream, pos.x * 256);
		Int32.write(stream, pos.y * 256);
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
export namespace DisconnectReason {
	export const read = UInt8.read;
	export const write = UInt8.write;
}

export type SmallProgress = number | null;
export const SmallProgress: Duplexer<SmallProgress> = {
	read(stream: Readable): SmallProgress {
		const value = UInt8.read(stream);
		return value === 255 ? null : value / 254;
	},
	write(stream: Writable, progress: SmallProgress) {
		UInt8.write(stream, progress === null ? 255 : Math.floor(progress * 254));
	},
}
