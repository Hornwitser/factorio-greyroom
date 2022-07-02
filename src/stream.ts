export class DecodeError extends Error {
	code = "DECODE_ERROR";
	constructor(
		message: string,
		public context: object = {}
	) {
		super(message);
	}
}

export class ReadableStream {
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

export type Reader<T> = (stream: ReadableStream) => T;

export function readBool(stream: ReadableStream) {
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
export function readUInt8(stream: ReadableStream) {
	const buf = stream.read(1);
	if (buf.length < 1) {
		throw new DecodeError("End of stream reached reading UInt8", { stream });
	}
	return buf.readUInt8();
}
export function readUInt16(stream: ReadableStream) {
	const buf = stream.read(2);
	if (buf.length < 2) {
		throw new DecodeError("End of stream reached reading UInt16", { stream });
	}
	return buf.readUInt16LE();
}
export function readUInt32(stream: ReadableStream) {
	const buf = stream.read(4);
	if (buf.length < 4) {
		throw new DecodeError("End of stream reached reading UInt32", { stream });
	}
	return buf.readUInt32LE();
}
export function readInt32(stream: ReadableStream) {
	const buf = stream.read(4);
	if (buf.length < 4) {
		throw new DecodeError("End of stream reached reading Int32", { stream });
	}
	return buf.readInt32LE();
}
export function readDouble(stream: ReadableStream) {
	const buf = stream.read(8);
	if (buf.length < 8) {
		throw new DecodeError("End of stream reached reading Double", { stream });
	}
	return buf.readDoubleLE();
}
export function readBuffer(stream: ReadableStream, size?: number) {
	const buf = stream.read(size);
	if (size !== undefined && buf.length < size) {
		throw new DecodeError(`End of stream reached reading Buffer[${size}]`, { stream });
	}
	return buf;
}

export function readSpaceOptimizedUInt16(stream: ReadableStream) {
	let value = readUInt8(stream);
	if (value === 0xff) {
		value = readUInt16(stream);
	}
	return value;
}

export function readSpaceOptimizedUInt32(stream: ReadableStream) {
	let value = readUInt8(stream);
	if (value === 0xff) {
		value = readUInt32(stream);
	}
	return value;
}

export function readString(stream: ReadableStream) {
	const size = readSpaceOptimizedUInt32(stream);
	return readBuffer(stream, size);
}

export function readUtf8String(stream: ReadableStream) {
	return readString(stream).toString();
}

export function readArray<T>(
	stream: ReadableStream,
	readItem: (stream: ReadableStream) => T,
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
	stream: ReadableStream,
	readKey: (stream: ReadableStream) => K,
	readValue: (stream: ReadableStream) => V,
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


export class WritableStream {
	private bufs: Buffer[] = [];

	write(buf: Buffer) {
		this.bufs.push(buf);
	}

	data() {
		return Buffer.concat(this.bufs);
	}
}

export type Writer<T> = (stream: WritableStream, value: T) => void;

export function writeBool(stream: WritableStream, value: boolean) {
	const buf = Buffer.alloc(1);
	buf.writeUInt8(Number(value));
	stream.write(buf);
}
export function writeUInt8(stream: WritableStream, value: number) {
	const buf = Buffer.alloc(1);
	buf.writeUInt8(value);
	stream.write(buf);
}
export function writeUInt16(stream: WritableStream, value: number) {
	const buf = Buffer.alloc(2);
	buf.writeUInt16LE(value);
	stream.write(buf);
}
export function writeUInt32(stream: WritableStream, value: number) {
	const buf = Buffer.alloc(4);
	buf.writeUInt32LE(value);
	stream.write(buf);
}
export function writeInt32(stream: WritableStream, value: number) {
	const buf = Buffer.alloc(4);
	buf.writeInt32LE(value);
	stream.write(buf);
}
export function writeDouble(stream: WritableStream, value: number) {
	const buf = Buffer.alloc(8);
	buf.writeDoubleLE(value);
	stream.write(buf);
}
export function writeBuffer(stream: WritableStream, buf: Buffer) {
	stream.write(buf);
}

export function writeSpaceOptimizedUInt16(stream: WritableStream, value: number) {
	if (value > 0xff) {
		writeUInt8(stream, 0xff);
		writeUInt16(stream, value);
	} else {
		writeUInt8(stream, value);
	}
}

export function writeSpaceOptimizedUInt32(stream: WritableStream, value: number) {
	if (value > 0xff) {
		writeUInt8(stream, 0xff);
		writeUInt32(stream, value);
	} else {
		writeUInt8(stream, value);
	}
}

export function writeString(stream: WritableStream, str: Buffer) {
	writeSpaceOptimizedUInt32(stream, str.length);
	writeBuffer(stream, str);
}

export function writeUtf8String(stream: WritableStream, str: string) {
	writeString(stream, Buffer.from(str));
}

export function writeArray<T>(
	stream: WritableStream,
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
	stream: WritableStream,
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

export interface Streamable<T> {
	read(stream: ReadableStream): T,
	write(stream: WritableStream, value: T): void,
}
