import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CLASS, constructDecorator, METHOD } from '@qiwi/decorator-utils';
import { ApiException, ApiExceptionConfig } from '@system/externals/configurations/exception.config';
import { docKeyValueStorage } from '@system/externals/repositories/doc-key-value.storage';
import { generateDescription } from './functools/generate-description.functool';
import { TextFormateService } from './functools/text-formate.service';

const TTL = 5000;

export const ApiDescription = constructDecorator(async ({ targetType, descriptor, proto, propName, args, ctor }) => {
  const options = args[0] ?? {};
  if (targetType === METHOD) {
    if (propName) {
      await docKeyValueStorage.set(`${ctor.name}:${String(propName)}`, true, TTL);
      const summary = new TextFormateService(String(propName)).camelCaseToSentence().upperSentence().text;
      ApiOperation({ ...options, summary: summary })(proto, propName, descriptor);
    }
  } else if (targetType === CLASS) {
    const methods = Object.getOwnPropertyNames(proto).filter((prop) => prop !== 'constructor');
    for (const propName of methods) {
      const result = await docKeyValueStorage.get(`${ctor.name}:${propName}`);
      if (result) continue;
      const summary = new TextFormateService(propName).camelCaseToSentence().upperSentence().text;
      ApiOperation({ ...options, summary: summary })(proto, propName, Object.getOwnPropertyDescriptor(proto, propName));
    }
  }
});

export const ApiExceptionResponse = (...args: ApiException.Enum[]) => {
  const schema = generateDescription(...args.map((e) => ApiExceptionConfig[e]));
  return applyDecorators(ApiResponse(schema));
};
