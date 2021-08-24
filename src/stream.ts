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

	readSpaceOptimizedUInt16() {
		let value = this.readUInt8();
		if (value === 0xff) {
			value = this.readUInt16();
		}
		return value;
	}

	readSpaceOptimizedUInt32() {
		let value = this.readUInt8();
		if (value === 0xff) {
			value = this.readUInt32();
		}
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

	readString() {
		const size = this.readSpaceOptimizedUInt32();
		return this.readBuffer(size);
	}

	readUtf8String() {
		return this.readString().toString();
	}

	readArray<T>(
		readItem: (stream: this) => T,
		readSize = (stream: this) => stream.readSpaceOptimizedUInt32(),
	) {
		let items = [];
		const size = readSize(this);
		for (let i = 0; i < size; i++) {
			items.push(readItem(this));
		}
		return items;
	}

	readMap<K, V>(
		readKey: (stream: this) => K,
		readValue: (stream: this) => V,
		readSize = (stream: this) => stream.readSpaceOptimizedUInt32(),
	) {
		let map = new Map<K, V>();
		const size = readSize(this);
		for (let i = 0; i < size; i++) {
			map.set(readKey(this), readValue(this));
		}
		return map;
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

	writeSpaceOptimizedUInt16(value: number) {
		if (value > 0xff) {
			this.writeUInt8(0xff);
			this.writeUInt16(value);
		} else {
			this.writeUInt8(value);
		}
	}


	writeSpaceOptimizedUInt32(value: number) {
		if (value > 0xff) {
			this.writeUInt8(0xff);
			this.writeUInt32(value);
		} else {
			this.writeUInt8(value);
		}
	}

	writeBuffer(buf: Buffer) {
		this.bufs.push(buf);
	}

	writeString(str: Buffer) {
		this.writeSpaceOptimizedUInt32(str.length);
		this.writeBuffer(str);
	}

	writeUtf8String(str: string) {
		this.writeString(Buffer.from(str));
	}

	writeArray<T>(
		items: T[],
		writeItem = (item: T, stream: this) => { (item as unknown as Writable).write(stream); },
		writeSize = (size: number, stream: this) => { stream.writeSpaceOptimizedUInt32(size); },
	) {
		writeSize(items.length, this);
		for (let item of items) {
			writeItem(item, this);
		}
	}

	writeMap<K, V>(
		map: Map<K, V>,
		writeKey = (key: K, stream: this) => { (key as unknown as Writable).write(stream); },
		writeValue = (value: V, stream: this) => { (value as unknown as Writable).write(stream); },
		writeSize = (size: number, stream: this) => { stream.writeSpaceOptimizedUInt32(size); },
	) {
		writeSize(map.size, this);
		for (let [key, value] of map) {
			writeKey(key, this);
			writeValue(value, this);
		}
	}

	data() {
		return Buffer.concat(this.bufs);
	}
}

export interface Writable {
	write(stream: WritableStream): void;
}

export interface Readable {
	read(stream: ReadableStream): unknown;
}
