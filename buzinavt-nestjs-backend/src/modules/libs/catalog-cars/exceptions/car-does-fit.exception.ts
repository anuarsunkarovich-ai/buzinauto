export class CarDoesFitException extends Error {
  constructor() {
    super("Car doesn't fit");
  }
}
