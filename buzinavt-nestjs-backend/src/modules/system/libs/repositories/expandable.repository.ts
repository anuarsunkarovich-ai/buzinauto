import { Either } from '@sweet-monads/either';
import { PaginationResult } from '../plugins/pagination-plugin';
import { MoneyEntity } from '../services/money.entity';

export type TExpandableMethods<D> = {
  getDocs: (limit: number | string, page: number | string) => Promise<PaginationResult<D>>;
  getCount: () => Promise<MoneyEntity>;
};

export abstract class ExpandableRepository<D = unknown> {
  abstract getManyUsingFilter(filter: unknown, limit: MoneyEntity, page: MoneyEntity): Promise<PaginationResult<D>>;
  abstract getCountUsingFilter(filter: unknown): Promise<MoneyEntity>;
  abstract getOneUsingFilter(filter: unknown): Promise<Either<Error, D>>;

  public builderMethods(filter: unknown): TExpandableMethods<D> {
    return {
      getDocs: async (limit: number | string, page: number | string) => {
        return await this.getManyUsingFilter(filter, MoneyEntity.of(limit), MoneyEntity.of(page));
      },
      getCount: async () => {
        return await this.getCountUsingFilter(filter);
      },
    };
  }
}
