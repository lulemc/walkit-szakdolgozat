/** The same keys as the English texts, each with its own (translated) string */
export type Translation<T> = { [K in keyof T]: T[K] extends string ? string : Translation<T[K]> };
