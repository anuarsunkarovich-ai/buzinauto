import { PaginationResult } from '@system/libs/plugins/pagination-plugin';

export class PaginateMapper {
  static mapToController<TEntity>(paginate: PaginationResult<TEntity>, mapper: (TEntity: TEntity) => unknown) {
    const { limit, page, hasNextPage } = paginate;
    return {
      limit: paginate.limit,
      offset: (page - 1) * limit,
      hasNextPage,
      hasPrevPage: page > 1,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      page: paginate.page,
      docs: paginate?.docs?.map((e) => mapper(e)),
    };
  }
}
