import { DynamicModule, ForwardReference, Module, Type } from '@nestjs/common';

@Module({})
export class AnyModule {}

type ModuleType = Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference;

export const IfTrueModule = (state: boolean, module: ModuleType) => {
  return state ? module : AnyModule;
};
