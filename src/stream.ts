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
	repr?(value: T): string,
}

export type DuplexerLookupTable<Enum extends number, ValueType extends Record<Enum, any>> = {
	[T in Enum]: Duplexer<ValueType[T]>;
};
