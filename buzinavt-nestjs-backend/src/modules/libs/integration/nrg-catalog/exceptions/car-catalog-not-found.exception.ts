export class CarCatalogNotFoundException extends Error {
  constructor() {
    super('Car Catalog Not Found');
  }
}
