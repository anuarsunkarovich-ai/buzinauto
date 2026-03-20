import { JapanAuction } from '../types/japan-auction.type';

export class JapanAuctionHelperService {
  /**
   * Главный метод парсинга с правильной обработкой экранированных кавычек
   */
  private extractDataFromVarStatement(jsCode: string, varName: string = 'data'): any {
    const regex = new RegExp(`var\\s+${varName}\\s*=\\s*({[\\s\\S]*?});`, 'i');
    const match = jsCode.match(regex);

    if (!match || !match[1]) {
      return null;
    }

    try {
      let cleanedCode = match[1];

      cleanedCode = cleanedCode.replace(/\\"/g, '"');

      const result = eval(`(${cleanedCode})`);
      return result;
    } catch (error) {
      console.error('Ошибка при парсинге данных:', error);
      console.log('Проблемная строка:', match[1].substring(0, 500) + '...');

      // Fallback: пробуем более агрессивную очистку
      try {
        return this.parseWithManualCleaning(match[1]);
      } catch (fallbackError) {
        console.error('Fallback тоже не сработал:', fallbackError);
        return null;
      }
    }
  }

  /**
   * Ручная очистка и парсинг сложных случаев
   */
  private parseWithManualCleaning(jsObjectString: string): any {
    let cleaned = jsObjectString.trim();

    // Удаляем экранирование кавычек
    cleaned = cleaned.replace(/\\"/g, '"');

    // Удаляем экранирование слешей
    cleaned = cleaned.replace(/\\\\/g, '\\');

    // Декодируем HTML entities
    cleaned = this.decodeHtmlEntities(cleaned);

    // Используем Function constructor вместо eval (безопаснее)
    const func = new Function('return ' + cleaned);
    return func();
  }

  /**
   * Декодирование HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
    };

    // Декодируем числовые HTML entities
    text = text.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec));
    });

    // Декодируем именованные entities
    return text.replace(/&[a-z]+;/gi, (match) => {
      return entities[match] || match;
    });
  }

  /**
   * Альтернативный метод - преобразование в JSON с правильной обработкой кавычек
   */
  private convertToJsonAndParse(jsObjectString: string): any {
    let jsonString = jsObjectString.replace('var data =', '').trim();

    // Заменяем экранированные кавычки на временные маркеры
    const ESCAPED_QUOTE_MARKER = '___ESC_QUOTE___';
    jsonString = jsonString.replace(/\\"/g, ESCAPED_QUOTE_MARKER);

    // Заменяем ключи объектов на ключи в двойных кавычках
    jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

    // Заменяем одинарные кавычки на двойные (только для значений)
    jsonString = jsonString.replace(/:\s*'([^']*)'/g, ':"$1"');

    // Возвращаем экранированные кавычки, но уже как содержимое строк
    jsonString = jsonString.replace(new RegExp(ESCAPED_QUOTE_MARKER, 'g'), '\\"').replace(/\\"/g, '"');

    // Декодируем HTML entities
    jsonString = this.decodeHtmlEntities(jsonString);

    return JSON.parse(jsonString);
  }

  /**
   * Извлечение JavaScript кода из HTML
   */
  private extractJavaScriptFromScript(htmlResponse: string): string | null {
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/i;
    const match = htmlResponse.match(scriptRegex);

    if (!match || !match[1]) {
      return null;
    }

    return match[1];
  }

  /**
   * Метод для извлечения и парсинга конкретного свойства из JavaScript кода
   */
  private extractPropertyFromJsCode(jsCode: string, propertyName: string): any {
    // Ищем паттерн 'propertyName': 'value'
    const regex = new RegExp(`'${propertyName}':\\s*'([^']+)'`, 'i');
    const match = jsCode.replace("\\'", '').match(regex);

    if (!match || !match[1]) {
      return null;
    }

    const propertyValue = match[1];

    // Попробуем разные методы парсинга
    const methods = [
      () => this.extractDataFromVarStatement(propertyValue),
      () => this.convertToJsonAndParse(propertyValue),
      () => this.parseWithManualCleaning(propertyValue),
    ];

    let i = 0;
    for (const method of methods) {
      try {
        i++;
        const result = method();
        if (result && typeof result === 'object') {
          return result;
        }
      } catch (error) {
        console.log(`${i} Метод не сработал: ${error.message}`);
        continue;
      }
    }

    return null;
  }

  /**
   * Дополнительная очистка результата от артефактов парсинга
   */
  private cleanupResult(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.cleanupResult(item));
    }

    const cleaned: any = {};

    for (const [key, value] of Object.entries(obj)) {
      let cleanValue: string = value as string;

      // Убираем лишние экранированные кавычки из строк
      if (typeof value === 'string') {
        cleanValue = value.replace(/^\\"|\\"$/g, ''); // Убираем \" в начале и конце
        cleanValue = cleanValue.replace(/\\"/g, '"');
        cleanValue = cleanValue.replace(/&nbsp;/g, ' '); // Заменяем HTML-сущность &nbsp; на пробел
      } else if (typeof value === 'object') {
        cleanValue = this.cleanupResult(value);
      }

      cleaned[key] = cleanValue;
    }

    return cleaned;
  }

  /**
   * Основной публичный метод для парсинга
   */
  public parseScriptResponseSafe(htmlResponse: string): {
    tpl_poisk: { navi?: Partial<JapanAuction.RawPaginationRepsonse> };
    tpl_kuzov: any;
  } {
    const jsCode = this.extractJavaScriptFromScript(htmlResponse);

    if (!jsCode) {
      console.error('JavaScript код не найден в ответе');
      return { tpl_poisk: {}, tpl_kuzov: {} };
    }

    const result = {
      tpl_poisk: {},
      tpl_kuzov: {},
    };

    // Извлекаем и парсим tpl_poisk
    try {
      const tplPoiskData = this.extractPropertyFromJsCode(jsCode, 'tpl_poisk');
      if (tplPoiskData) {
        result.tpl_poisk = this.cleanupResult(tplPoiskData);
      }
    } catch (error) {
      console.error('Ошибка при парсинге tpl_poisk:', error);
    }

    // Извлекаем и парсим tpl_kuzov
    try {
      const tplKuzovData = this.extractPropertyFromJsCode(jsCode, 'tpl_kuzov');
      if (tplKuzovData) {
        result.tpl_kuzov = this.cleanupResult(tplKuzovData);
      }
    } catch (error) {
      console.error('Ошибка при парсинге tpl_kuzov:', error);
    }

    return result;
  }
}
