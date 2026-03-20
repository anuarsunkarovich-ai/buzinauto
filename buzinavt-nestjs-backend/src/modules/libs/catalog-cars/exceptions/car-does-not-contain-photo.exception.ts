export class CarDoesNotContainPhotoException extends Error {
  constructor() {
    super('Car does not contain photo');
  }
}
