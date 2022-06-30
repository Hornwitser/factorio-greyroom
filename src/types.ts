import type { ReadableStream, WritableStream } from "./stream"

export type DuplexTable<Enum extends number, ValueType extends Record<Enum, any>> = {
	[T in Enum]: {
		read: (stream: ReadableStream) => ValueType[T],
		write: (stream: WritableStream, value: ValueType[T]) => void,
	}
};
