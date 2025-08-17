import Document from "../models/Document.js";

export async function findOrCreateDocument(id) {
  if (!id) return null;
  const doc = await Document.findById(id);
  if (doc) return doc;
  return await Document.create({ _id: id, data: { ops: [] } });
}