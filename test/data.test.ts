import { Duplexer, PropertyTree, PropertyTreeType, ReadableStream, WritableStream } from "../src";

function checkRoundtrip<T>(
	input: T,
	type: Duplexer<T>,
) {
	const writeStream = new WritableStream();
	type.write(writeStream, input);
	const readStream = new ReadableStream(writeStream.data());
	const output = type.read(readStream);
	expect(input).toEqual(output);
}

test("PropertyTree roundtrip", () => {
	checkRoundtrip(new PropertyTree(PropertyTreeType.None, false, undefined), PropertyTree);
	checkRoundtrip(new PropertyTree(PropertyTreeType.Bool, false, true), PropertyTree);
	checkRoundtrip(new PropertyTree(PropertyTreeType.Number, false, 12.5), PropertyTree);
	checkRoundtrip(new PropertyTree(PropertyTreeType.String, false, "foo"), PropertyTree);
	checkRoundtrip(new PropertyTree(PropertyTreeType.List, false, []), PropertyTree);
	checkRoundtrip(new PropertyTree(PropertyTreeType.Dictionary, false, []), PropertyTree);

	checkRoundtrip(new PropertyTree(PropertyTreeType.List, false, [
		new PropertyTree(PropertyTreeType.None, false, undefined),
		new PropertyTree(PropertyTreeType.Bool, false, true),
		new PropertyTree(PropertyTreeType.Number, false, 12.5),
		new PropertyTree(PropertyTreeType.String, false, "foo"),
		new PropertyTree(PropertyTreeType.List, false, []),
		new PropertyTree(PropertyTreeType.Dictionary, false, []),
	]), PropertyTree);

	checkRoundtrip(new PropertyTree(PropertyTreeType.Dictionary, false, [
		new PropertyTree(PropertyTreeType.None, false, undefined, "none"),
		new PropertyTree(PropertyTreeType.Bool, false, true, "bool"),
		new PropertyTree(PropertyTreeType.Number, false, 12.5, "number"),
		new PropertyTree(PropertyTreeType.String, false, "foo", "string"),
		new PropertyTree(PropertyTreeType.List, false, [], "list"),
		new PropertyTree(PropertyTreeType.Dictionary, false, [], "dictionary"),
	]), PropertyTree);
});
