import { PropertyTree, PropertyTreeType } from "../src/data";
import { ReadableStream, WritableStream } from "../src/stream";

function checkRoundtrip<T>(
	input: T,
	read: (stream: ReadableStream) => T,
	write: (stream: WritableStream, value: T) => void,
) {
	const writeStream = new WritableStream();
	write(writeStream, input);
	const readStream = new ReadableStream(writeStream.data());
	const output = read(readStream);
	expect(input).toEqual(output);
}

test("PropertyTree roundtrip", () => {
	checkRoundtrip(new PropertyTree(PropertyTreeType.None, false, undefined), PropertyTree.read, PropertyTree.write);
	checkRoundtrip(new PropertyTree(PropertyTreeType.Bool, false, true), PropertyTree.read, PropertyTree.write);
	checkRoundtrip(new PropertyTree(PropertyTreeType.Number, false, 12.5), PropertyTree.read, PropertyTree.write);
	checkRoundtrip(new PropertyTree(PropertyTreeType.String, false, "foo"), PropertyTree.read, PropertyTree.write);
	checkRoundtrip(new PropertyTree(PropertyTreeType.List, false, []), PropertyTree.read, PropertyTree.write);
	checkRoundtrip(new PropertyTree(PropertyTreeType.Dictionary, false, []), PropertyTree.read, PropertyTree.write);

	checkRoundtrip(new PropertyTree(PropertyTreeType.List, false, [
		new PropertyTree(PropertyTreeType.None, false, undefined),
		new PropertyTree(PropertyTreeType.Bool, false, true),
		new PropertyTree(PropertyTreeType.Number, false, 12.5),
		new PropertyTree(PropertyTreeType.String, false, "foo"),
		new PropertyTree(PropertyTreeType.List, false, []),
		new PropertyTree(PropertyTreeType.Dictionary, false, []),
	]), PropertyTree.read, PropertyTree.write);

	checkRoundtrip(new PropertyTree(PropertyTreeType.Dictionary, false, [
		new PropertyTree(PropertyTreeType.None, false, undefined, "none"),
		new PropertyTree(PropertyTreeType.Bool, false, true, "bool"),
		new PropertyTree(PropertyTreeType.Number, false, 12.5, "number"),
		new PropertyTree(PropertyTreeType.String, false, "foo", "string"),
		new PropertyTree(PropertyTreeType.List, false, [], "list"),
		new PropertyTree(PropertyTreeType.Dictionary, false, [], "dictionary"),
	]), PropertyTree.read, PropertyTree.write);
});
