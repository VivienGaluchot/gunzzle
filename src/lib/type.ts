export type FixedSizeArray<N extends number, T> = N extends 0 ? never[]
    : { 0: T; length: N } & Array<T>;

export function fixedMap<N extends number, T, O>(
    array: FixedSizeArray<N, T>,
    callback: (value: T, index: number) => O,
): FixedSizeArray<N, O> {
    return array.map(callback) as FixedSizeArray<N, O>;
}

export function assertDefined<T>(value: T | undefined): T {
    if (value !== undefined) {
        return value;
    } else {
        throw new Error("undefined value");
    }
}
