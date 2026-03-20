export class InvalidRequestService extends Error {
  constructor() {
    super('Invalid Request');
  }
}
