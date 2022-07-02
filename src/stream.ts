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

export type Reader<T> = (stream: Readable) => T;

export function readBool(stream: Readable) {
	const buf = stream.read(1);
	if (buf.length < 1) {
		throw new DecodeError("End of stream reached reading bool", { stream });
	}
	const value = buf.readUInt8();
	if (value > 1) {
		throw new DecodeError(`Invalid boolean data read: ${value}`, { stream });
	}
	return Boolean(value);
}
export function readUInt8(stream: Readable) {
	const buf = stream.read(1);
	if (buf.length < 1) {
		throw new DecodeError("End of stream reached reading UInt8", { stream });
	}
	return buf.readUInt8();
}
export function readUInt16(stream: Readable) {
	const buf = stream.read(2);
	if (buf.length < 2) {
		throw new DecodeError("End of stream reached reading UInt16", { stream });
	}
	return buf.readUInt16LE();
}
export function readUInt32(stream: Readable) {
	const buf = stream.read(4);
	if (buf.length < 4) {
		throw new DecodeError("End of stream reached reading UInt32", { stream });
	}
	return buf.readUInt32LE();
}
export function readInt32(stream: Readable) {
	const buf = stream.read(4);
	if (buf.length < 4) {
		throw new DecodeError("End of stream reached reading Int32", { stream });
	}
	return buf.readInt32LE();
}
export function readDouble(stream: Readable) {
	const buf = stream.read(8);
	if (buf.length < 8) {
		throw new DecodeError("End of stream reached reading Double", { stream });
	}
	return buf.readDoubleLE();
}
export function readBuffer(stream: Readable, size?: number) {
	const buf = stream.read(size);
	if (size !== undefined && buf.length < size) {
		throw new DecodeError(`End of stream reached reading Buffer[${size}]`, { stream });
	}
	return buf;
}

export function readSpaceOptimizedUInt16(stream: Readable) {
	let value = readUInt8(stream);
	if (value === 0xff) {
		value = readUInt16(stream);
	}
	return value;
}

export function readSpaceOptimizedUInt32(stream: Readable) {
	let value = readUInt8(stream);
	if (value === 0xff) {
		value = readUInt32(stream);
	}
	return value;
}

export function readString(stream: Readable) {
	const size = readSpaceOptimizedUInt32(stream);
	return readBuffer(stream, size);
}

export function readUtf8String(stream: Readable) {
	return readString(stream).toString();
}

export function readArray<T>(
	stream: Readable,
	readItem: (stream: Readable) => T,
	readSize = readSpaceOptimizedUInt32,
) {
	let items = [];
	const size = readSize(stream);
	for (let i = 0; i < size; i++) {
		items.push(readItem(stream));
	}
	return items;
}

export function readMap<K, V>(
	stream: Readable,
	readKey: (stream: Readable) => K,
	readValue: (stream: Readable) => V,
	readSize = readSpaceOptimizedUInt32,
) {
	let map = new Map<K, V>();
	const size = readSize(stream);
	for (let i = 0; i < size; i++) {
		map.set(readKey(stream), readValue(stream));
	}
	return map;
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

export type Writer<T> = (stream: Writable, value: T) => void;

export function writeBool(stream: Writable, value: boolean) {
	const buf = Buffer.alloc(1);
	buf.writeUInt8(Number(value));
	stream.write(buf);
}
export function writeUInt8(stream: Writable, value: number) {
	const buf = Buffer.alloc(1);
	buf.writeUInt8(value);
	stream.write(buf);
}
export function writeUInt16(stream: Writable, value: number) {
	const buf = Buffer.alloc(2);
	buf.writeUInt16LE(value);
	stream.write(buf);
}
export function writeUInt32(stream: Writable, value: number) {
	const buf = Buffer.alloc(4);
	buf.writeUInt32LE(value);
	stream.write(buf);
}
export function writeInt32(stream: Writable, value: number) {
	const buf = Buffer.alloc(4);
	buf.writeInt32LE(value);
	stream.write(buf);
}
export function writeDouble(stream: Writable, value: number) {
	const buf = Buffer.alloc(8);
	buf.writeDoubleLE(value);
	stream.write(buf);
}
export function writeBuffer(stream: Writable, buf: Buffer) {
	stream.write(buf);
}

export function writeSpaceOptimizedUInt16(stream: Writable, value: number) {
	if (value > 0xff) {
		writeUInt8(stream, 0xff);
		writeUInt16(stream, value);
	} else {
		writeUInt8(stream, value);
	}
}

export function writeSpaceOptimizedUInt32(stream: Writable, value: number) {
	if (value > 0xff) {
		writeUInt8(stream, 0xff);
		writeUInt32(stream, value);
	} else {
		writeUInt8(stream, value);
	}
}

export function writeString(stream: Writable, str: Buffer) {
	writeSpaceOptimizedUInt32(stream, str.length);
	writeBuffer(stream, str);
}

export function writeUtf8String(stream: Writable, str: string) {
	writeString(stream, Buffer.from(str));
}

export function writeArray<T>(
	stream: Writable,
	items: T[],
	writeItem: Writer<T>,
	writeSize: Writer<number> = writeSpaceOptimizedUInt32,
) {
	writeSize(stream, items.length);
	for (let item of items) {
		writeItem(stream, item);
	}
}

export function writeMap<K, V>(
	stream: Writable,
	map: Map<K, V>,
	writeKey: Writer<K>,
	writeValue: Writer<V>,
	writeSize: Writer<number> = writeSpaceOptimizedUInt32,
) {
	writeSize(stream, map.size);
	for (let [key, value] of map) {
		writeKey(stream, key);
		writeValue(stream, value);
	}
}

export interface Duplexer<T> {
	read(stream: Readable): T,
	write(stream: Writable, value: T): void,
}

export type DuplexerLookupTable<Enum extends number, ValueType extends Record<Enum, any>> = {
	[T in Enum]: Duplexer<ValueType[T]>;
};
