import type { Document } from "./types.ts";

type ConvertDatesToStrings<T> = {
  [K in keyof T]: T[K] extends Date ? string
    : T[K] extends object ? ConvertDatesToStrings<T[K]>
    : T[K];
};

/**
 * Represents the response for reading a single document from the database.
 *
 * @template T - The type of the document's fields.
 * @property {ConvertDatesToStrings<T> & Document} document - The retrieved document with dates converted to strings.
 */
export type ReadSingleDocument<T extends object> = {
  document: ConvertDatesToStrings<T> & Document;
};

/**
 * Represents the response for reading multiple documents from the database.
 *
 * @template T - The type of the documents' fields.
 * @property {(ConvertDatesToStrings<T> & Document)[]} documents - The array of retrieved documents with dates converted to strings.
 */
export type ReadMultipleDocuments<T extends object> = {
  documents: (ConvertDatesToStrings<T> & Document)[];
};

/**
 * Represents the response for inserting a single document into the database.
 *
 * @property {string} insertedId - The ID of the inserted document.
 */
export type InsertSingleDocument = {
  insertedId: string;
};

/**
 * Represents the response for inserting multiple documents into the database.
 *
 * @property {string[]} insertedIds - An array of IDs of the inserted documents.
 */
export type InsertMultipleDocuments = {
  insertedIds: string[];
};

/**
 * Represents the result of an update operation in the database.
 *
 * @property {number} matchedCount - The number of documents matched by the filter.
 * @property {number} modifiedCount - The number of documents modified.
 */
export type UpdateOperation = {
  matchedCount: number;
  modifiedCount: number;
};

/**
 * Represents the result of a delete operation in the database.
 *
 * @property {number} deletedCount - The number of documents deleted.
 */
export type DeleteOperation = {
  deletedCount: number;
};
