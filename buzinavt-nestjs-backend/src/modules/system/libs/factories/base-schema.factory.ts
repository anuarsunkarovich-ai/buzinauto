import { Type } from '@nestjs/common';
import { SchemaFactory } from '@nestjs/mongoose';
import { paginationPlugin } from '../plugins/pagination-plugin';

type TOpts = {
  indexed?: {
    createdAt: boolean;
    updatedAt: boolean;
  };
  includes?: {
    paginate?: boolean;
    populate?: boolean;
    softDelete?: boolean;
  };
};

export class BaseSchemaFactory {
  public static createForClass<TClass>(target: Type<TClass>, opts?: TOpts) {
    let result = SchemaFactory.createForClass(target).index({ createdAt: 1 });
    if (opts?.indexed?.createdAt || typeof opts?.indexed?.createdAt === 'undefined') {
      result = result.index({ createdAt: 1 });
    }
    if (opts?.indexed?.updatedAt) {
      result = result.index({ updatedAt: 1 });
    }
    if (opts?.includes?.paginate) {
      result = result.plugin(paginationPlugin());
    }
    if (opts?.includes?.populate) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      result = result.plugin(require('mongoose-autopopulate'));
    }
    if (opts?.includes?.softDelete) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      result = result.plugin(require('mongoose-delete'), { overrideMethods: true, indexFields: ['deleted'] });
    }
    return result;
  }
}
