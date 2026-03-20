import { Model, ProjectionType, RootFilterQuery, Schema } from 'mongoose';

export const paginationPlugin = () => {
  return (schema: Schema) => {
    /**
     * Paginate a query using Mongoose.
     * @param {Object} filter - The filter object for the query.
     * @param {Object} options - Options for pagination.
     * @param {Number} options.page - Current page number (1-based).
     * @param {Number} options.limit - Number of documents per page.
     * @param {Object} [options.sort] - Sorting criteria.
     * @param {Object} [options.projection] - Fields to return.
     * @param {Object} [options.populate] - Populate options.
     * @returns {Promise<{ data: Array, hasNext: Boolean }>} Paginated result.
     */
    schema.statics.paginate = async function (
      filter,
      { page = 1, limit = 10, sort = {}, projection = null, populate = null } = {}
    ) {
      const adjustedLimit = limit + 1;
      const skip = (page - 1) * limit;

      let query = this.find(filter).skip(skip).limit(adjustedLimit).sort(sort).select(projection);

      if (populate) {
        query = query.populate(populate);
      }

      const results = await query.exec();

      const hasNextPage = results.length > limit;

      if (hasNextPage) {
        results.pop();
      }

      return {
        docs: results,
        hasNextPage,
        page,
        limit,
      };
    };
  };
};

export interface PaginationResult<T> {
  docs: T[];
  hasNextPage: boolean;
  page: number;
  limit: number;
}

export interface PaginationModel<T> extends Model<T> {
  paginate(
    filter: RootFilterQuery<T>,
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, -1 | 1>;
      projection?: ProjectionType<T>;
      populate?: object | null;
    }
  ): Promise<PaginationResult<T>>;
}
