export namespace System {
  export type ObjectEmpty = Record<string, never>;
  export type ObjectUnknown = Record<string, unknown>;

  export type NullFunc = () => void | Promise<void>;

  export type Sort = 'desc' | 'asc';
  export const Sort = ['desc', 'asc'];

  export type BooleanString = 'true' | 'false';

  export type PickKey<D extends string, K extends D> = keyof Pick<Record<D, string>, K>;
  export type OmitKey<D extends string, K extends D> = keyof Omit<Record<D, string>, K>;

  export type ValueOf<T> = T[keyof T];

  export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
}
