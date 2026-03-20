export class DocumentNotFoundException extends Error {
  constructor() {
    super('Document not found');
  }
}
