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

	readBool() {
		if (this.pos + 1 > this.buf.length) {
			throw new DecodeError("End of stream reached reading bool", { stream: this });
		}
		const value = this.buf.readUInt8(this.pos);
		if (value > 1) {
			throw new DecodeError(`Invalid boolean data read: ${value}`, { stream: this });
		}
		this.pos += 1;
		return Boolean(value);
	}

	readUInt8() {
		if (this.pos + 1 > this.buf.length) {
			throw new DecodeError("End of stream reached reading UInt8", { stream: this });
		}
		const value = this.buf.readUInt8(this.pos);
		this.pos += 1;
		return value;
	}

	readUInt16() {
		if (this.pos + 2 > this.buf.length) {
			throw new DecodeError("End of stream reached reading UInt16", { stream: this });
		}
		const value = this.buf.readUInt16LE(this.pos);
		this.pos += 2;
		return value;
	}

	readUInt32() {
		if (this.pos + 4 > this.buf.length) {
			throw new DecodeError("End of stream reached reading UInt32", { stream: this });
		}
		const value = this.buf.readUInt32LE(this.pos);
		this.pos += 4;
		return value;
	}

	readInt32() {
		if (this.pos + 4 > this.buf.length) {
			throw new DecodeError("End of stream reached reading Int32", { stream: this });
		}
		const value = this.buf.readInt32LE(this.pos);
		this.pos += 4;
		return value;
	}

	readDouble() {
		if (this.pos + 8 > this.buf.length) {
			throw new DecodeError("End of stream reached reading Double", { stream: this });
		}
		const value = this.buf.readDoubleLE(this.pos);
		this.pos += 8;
		return value;
	}

	readBuffer(size?: number) {
		const end = size === undefined ? undefined : this.pos + size;
		if (end !== undefined && end > this.buf.length) {
			throw new DecodeError(`End of stream reached reading Buffer[${size}]`, { stream: this });
		}
		const buf = this.buf.slice(this.pos, end);
		this.pos += buf.length;
		return buf;
	}

	get readable() {
		return this.pos < this.buf.length;
	}
}

export type Reader<T> = (stream: ReadableStream) => T;

export function readBool(stream: ReadableStream) { return stream.readBool(); }
export function readUInt8(stream: ReadableStream) { return stream.readUInt8(); }
export function readUInt16(stream: ReadableStream) { return stream.readUInt16(); }
export function readUInt32(stream: ReadableStream) { return stream.readUInt32();}
export function readInt32(stream: ReadableStream) { return stream.readInt32();}
export function readDouble(stream: ReadableStream) { return stream.readDouble();}
export function readBuffer(stream: ReadableStream, size?: number) { return stream.readBuffer(size); }

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

	writeBool(value: boolean) {
		const buf = Buffer.alloc(1);
		buf.writeUInt8(Number(value));
		this.bufs.push(buf);
	}

	writeUInt8(value: number) {
		const buf = Buffer.alloc(1);
		buf.writeUInt8(value);
		this.bufs.push(buf);
	}

	writeUInt16(value: number) {
		const buf = Buffer.alloc(2);
		buf.writeUInt16LE(value);
		this.bufs.push(buf);
	}

	writeUInt32(value: number) {
		const buf = Buffer.alloc(4);
		buf.writeUInt32LE(value);
		this.bufs.push(buf);
	}

	writeInt32(value: number) {
		const buf = Buffer.alloc(4);
		buf.writeInt32LE(value);
		this.bufs.push(buf);
	}

	writeDouble(value: number) {
		const buf = Buffer.alloc(8);
		buf.writeDoubleLE(value);
		this.bufs.push(buf);
	}


	writeBuffer(buf: Buffer) {
		this.bufs.push(buf);
	}

	data() {
		return Buffer.concat(this.bufs);
	}
}

export type Writer<T> = (stream: WritableStream, value: T) => void;

export function writeBool(stream: WritableStream, value: boolean) { return stream.writeBool(value); }
export function writeUInt8(stream: WritableStream, value: number) { return stream.writeUInt8(value); }
export function writeUInt16(stream: WritableStream, value: number) { return stream.writeUInt16(value); }
export function writeUInt32(stream: WritableStream, value: number) { return stream.writeUInt32(value);}
export function writeInt32(stream: WritableStream, value: number) { return stream.writeInt32(value);}
export function writeDouble(stream: WritableStream, value: number) { return stream.writeDouble(value); }
export function writeBuffer(stream: WritableStream, buf: Buffer) { return stream.writeBuffer(buf); }

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
