export class DecodeError extends Error {
	code = "DECODE_ERROR";
	constructor(
		message: string,
		public context: object = {}
	) {
		super(message);
	}
}

export interface Readable {
	read(size?: number): Buffer,
}

export class ReadableStream implements Readable{
	constructor(
		public buf: Buffer,
		public pos: number = 0,
	) {}

	read(size?: number) {
		const buf = this.buf.slice(this.pos, size === undefined ? undefined : this.pos + size);
		this.pos += buf.length;
		return buf;
	}

	get readable() {
		return this.pos < this.buf.length;
	}
}


export class EncodeError extends Error {
	code = "ENCODE_ERROR";
	constructor(
		message: string,
		public context: object = {}
	) {
		super(message);
	}
}


export interface Writable {
	write(buf: Buffer): void,
}

export class WritableStream implements Writable {
	private bufs: Buffer[] = [];

	write(buf: Buffer) {
		this.bufs.push(buf);
	}

	data() {
		return Buffer.concat(this.bufs);
	}
}

export type Reader<T> = (stream: Readable) => T;
export type Writer<T> = (stream: Writable, value: T) => void;

export interface Duplexer<T> {
	read(stream: Readable): T,
	write(stream: Writable, value: T): void,
}

export type Bool = boolean;
export const Bool: Duplexer<Bool> = {
	read(stream: Readable) {
		const buf = stream.read(1);
		if (buf.length < 1) {
			throw new DecodeError("End of stream reached reading bool", { stream });
		}
		const value = buf.readUInt8();
		if (value > 1) {
			throw new DecodeError(`Invalid boolean data read: ${value}`, { stream });
		}
		return Boolean(value);
	},
	write(stream: Writable, value: boolean) {
		const buf = Buffer.alloc(1);
		buf.writeUInt8(Number(value));
		stream.write(buf);
	},
}

export type UInt8 = number;
export const UInt8: Duplexer<UInt8> = {
	read(stream: Readable) {
		const buf = stream.read(1);
		if (buf.length < 1) {
			throw new DecodeError("End of stream reached reading UInt8", { stream });
		}
		return buf.readUInt8();
	},
	write(stream: Writable, value: number) {
		const buf = Buffer.alloc(1);
		buf.writeUInt8(value);
		stream.write(buf);
	},
};

export type UInt16 = number;
export const UInt16: Duplexer<UInt16> = {
	read(stream: Readable) {
		const buf = stream.read(2);
		if (buf.length < 2) {
			throw new DecodeError("End of stream reached reading UInt16", { stream });
		}
		return buf.readUInt16LE();
	},
	write(stream: Writable, value: number) {
		const buf = Buffer.alloc(2);
		buf.writeUInt16LE(value);
		stream.write(buf);
	},
};

export type UInt32 = number;
export const UInt32: Duplexer<UInt32> = {
	read(stream: Readable) {
		const buf = stream.read(4);
		if (buf.length < 4) {
			throw new DecodeError("End of stream reached reading UInt32", { stream });
		}
		return buf.readUInt32LE();
	},
	write(stream: Writable, value: number) {
		const buf = Buffer.alloc(4);
		buf.writeUInt32LE(value);
		stream.write(buf);
	},
};

export type Int32 = number;
export const Int32: Duplexer<Int32> = {
	read(stream: Readable) {
		const buf = stream.read(4);
		if (buf.length < 4) {
			throw new DecodeError("End of stream reached reading Int32", { stream });
		}
		return buf.readInt32LE();
	},
	write(stream: Writable, value: number) {
		const buf = Buffer.alloc(4);
		buf.writeInt32LE(value);
		stream.write(buf);
	},
};

export type Double = number;
export const Double: Duplexer<Double> = {
	read(stream: Readable) {
		const buf = stream.read(8);
		if (buf.length < 8) {
			throw new DecodeError("End of stream reached reading Double", { stream });
		}
		return buf.readDoubleLE();
	},
	write(stream: Writable, value: number) {
		const buf = Buffer.alloc(8);
		buf.writeDoubleLE(value);
		stream.write(buf);
	},
};


export const BufferT = {
	read(stream: Readable, size?: number) {
		const buf = stream.read(size);
		if (size !== undefined && buf.length < size) {
			throw new DecodeError(`End of stream reached reading Buffer[${size}]`, { stream });
		}
		return buf;
	},
	write(stream: Writable, buf: Buffer) {
		stream.write(buf);
	},
};

export type SpaceOptimizedUInt16 = number;
export const SpaceOptimizedUInt16: Duplexer<SpaceOptimizedUInt16> = {
	read(stream: Readable) {
		let value = UInt8.read(stream);
		if (value === 0xff) {
			value = UInt16.read(stream);
		}
		return value;
	},
	write(stream: Writable, value: number) {
		if (value > 0xff) {
			UInt8.write(stream, 0xff);
			UInt16.write(stream, value);
		} else {
			UInt8.write(stream, value);
		}
	},
};

export type SpaceOptimizedUInt32 = number;
export const SpaceOptimizedUInt32: Duplexer<SpaceOptimizedUInt32> = {
	read(stream: Readable) {
		let value = UInt8.read(stream);
		if (value === 0xff) {
			value = UInt32.read(stream);
		}
		return value;
	},
	write(stream: Writable, value: number) {
		if (value > 0xff) {
			UInt8.write(stream, 0xff);
			UInt32.write(stream, value);
		} else {
			UInt8.write(stream, value);
		}
	},
};


export const StringT: Duplexer<Buffer> = {
	read(stream: Readable) {
		const size = SpaceOptimizedUInt32.read(stream);
		return BufferT.read(stream, size);
	},
	write(stream: Writable, str: Buffer) {
		SpaceOptimizedUInt32.write(stream, str.length);
		BufferT.write(stream, str);
	},
};


export type Utf8String = string;
export const Utf8String: Duplexer<Utf8String> = {
	read(stream: Readable) {
		return StringT.read(stream).toString();
	},
	write(stream: Writable, str: string) {
		StringT.write(stream, Buffer.from(str));
	},
};


export const ArrayT = {
	read<T>(
		stream: Readable,
		readItem: (stream: Readable) => T,
		readSize = SpaceOptimizedUInt32.read,
	) {
		let items = [];
		const size = readSize(stream);
		for (let i = 0; i < size; i++) {
			items.push(readItem(stream));
		}
		return items;
	},
	write<T>(
		stream: Writable,
		items: T[],
		writeItem: Writer<T>,
		writeSize: Writer<number> = SpaceOptimizedUInt32.write,
	) {
		writeSize(stream, items.length);
		for (let item of items) {
			writeItem(stream, item);
		}
	},
};

export const MapT = {
	read<K, V>(
		stream: Readable,
		readKey: (stream: Readable) => K,
		readValue: (stream: Readable) => V,
		readSize = SpaceOptimizedUInt32.read,
	) {
		let map = new Map<K, V>();
		const size = readSize(stream);
		for (let i = 0; i < size; i++) {
			map.set(readKey(stream), readValue(stream));
		}
		return map;
	},
	write<K, V>(
		stream: Writable,
		map: Map<K, V>,
		writeKey: Writer<K>,
		writeValue: Writer<V>,
		writeSize: Writer<number> = SpaceOptimizedUInt32.write,
	) {
		writeSize(stream, map.size);
		for (let [key, value] of map) {
			writeKey(stream, key);
			writeValue(stream, value);
		}
	},
};

export type DuplexerLookupTable<Enum extends number, ValueType extends Record<Enum, any>> = {
	[T in Enum]: Duplexer<ValueType[T]>;
};
