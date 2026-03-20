import { Logger } from '@nestjs/common';

export class LoggerService extends Logger {
  constructor(protected readonly _name: string) {
    super(_name);
  }

  debug(message: any, ...optionalParams: any[]): void {
    if (this.isDebugEnabled()) {
      super.debug(message, ...optionalParams);
    }
  }

  private isDebugEnabled(): boolean {
    const debugEnv = process.env.DEBUG;
    if (!debugEnv) {
      return false;
    }
    if (debugEnv === 'true') {
      return true;
    }

    const debugPatterns = debugEnv.split(',').map((pattern) => pattern.trim());

    return debugPatterns.some((pattern) => {
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        try {
          const regex = new RegExp(pattern.slice(1, -1));
          return regex.test(this._name);
        } catch (e) {
          this.error(`Invalid regex pattern in DEBUG env: ${pattern}`);
          return false;
        }
      }

      return pattern === this._name;
    });
  }
}
