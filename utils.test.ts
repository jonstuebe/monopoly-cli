import { addArray, throwIfError } from "./utils";

describe("addArray", () => {
  it("adds the numbers", () => {
    expect(addArray([1, 2])).toEqual(3);
    expect(addArray([1, 2, 3])).toEqual(6);
    expect(addArray([1, 1], 1)).toEqual(3);
  });
});

describe("throwIfError", () => {
  it("throws an error", () => {
    function errorFn() {
      return new Error("test");
    }
    expect(() => throwIfError(errorFn)).toThrowError("test");
  });
  it("returns result", () => {
    function success(word: string) {
      return {
        foo: word,
      };
    }
    expect(
      throwIfError<{
        foo: string;
      }>(success, "bar")
    ).toEqual({
      foo: "bar",
    });
  });
});
