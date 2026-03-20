import { JapanAuction } from '../types/japan-auction.type';

export class JapanAuctionMapper {
  public static toObject(data: any): JapanAuction.ReadableAuction {
    const horsepower = (data.i ?? '').split(',')?.[0];
    return {
      id: data.a,
      prefix: data.f1,
      lotNumber: data.c,
      auctionName: data.d,
      date: data.e,
      time: data.f?.replace?.(/[\[\]]/g, '') || data.f, // Remove square brackets
      year: parseInt(data.g) || 0,
      body: (data.j ?? '').replace(/&#\d+;/g, ''),
      modification: data.l,
      transmission: data.k,
      horsepower: horsepower ? parseInt(horsepower) || horsepower : null,
      enginePower: data.h ? parseInt(data.h) : null,
      airConditioning: (data.m ?? '').replace(/&#\d+;/g, ''),
      driveType: data.n || '',
      mileageKm: data.q ? parseInt(data.q) : null,
      rating: data.r ? data.r : null,
      startingPriceYen: data.s ? parseInt(data.s) : null,
      color: data.w,
      finalPriceYen: data.t ? parseInt(data.t) : null,
      averagePrice: data.o ? parseInt(data.o) : null,
      averagePriceArray: data.p ? data.p.split(',').map((price: string) => parseInt(price)) : [],
      isSold: data.u === '1',
      soldStatus: data.v.replace(/<[^>]+>/g, '').trim(),
      isSanctions: data.i1 === '1',
      imageIds: [data.x, data.y, data.z].filter((id) => id),
      additionalData: {
        extraFields: {
          b: data.b,
          a1: data.a1,
          b1: data.b1,
          c1: data.c1,
          d1: data.d1,
          e1: data.e1,
          g1: data.g1,
          h1: data.h1,
        },
      },
    };
  }
}
