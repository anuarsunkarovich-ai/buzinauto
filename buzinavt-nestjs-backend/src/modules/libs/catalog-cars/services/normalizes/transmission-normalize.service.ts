enum TransmissionType {
  MANUAL = 'механическая',
  AUTOMATIC = 'автоматическая',
  CVT = 'вариатор',
  ROBOT = 'робот',
}

interface TransmissionMap {
  [key: string]: TransmissionType;
}

export class TransmissionNormalizerService {
  private transmissionDictionary: TransmissionMap = {
    // Механическая коробка передач (MT - Manual Transmission)
    mt: TransmissionType.MANUAL,
    '4mt': TransmissionType.MANUAL,
    '5mt': TransmissionType.MANUAL,
    '6mt': TransmissionType.MANUAL,
    fmt: TransmissionType.MANUAL,
    f4mt: TransmissionType.MANUAL,
    f5mt: TransmissionType.MANUAL,
    f6mt: TransmissionType.MANUAL,
    '5fmt': TransmissionType.MANUAL,
    '5dmt': TransmissionType.MANUAL,
    механическая: TransmissionType.MANUAL,
    мкпп: TransmissionType.MANUAL,
    manual: TransmissionType.MANUAL,
    m5: TransmissionType.MANUAL,
    m6: TransmissionType.MANUAL,

    // Автоматическая коробка передач (AT - Automatic Transmission)
    at: TransmissionType.AUTOMATIC,
    cat: TransmissionType.AUTOMATIC,
    dat: TransmissionType.AUTOMATIC,
    fat: TransmissionType.AUTOMATIC,
    iat: TransmissionType.AUTOMATIC,
    pat: TransmissionType.AUTOMATIC,
    sat: TransmissionType.AUTOMATIC,
    '4cat': TransmissionType.AUTOMATIC,
    '4at': TransmissionType.AUTOMATIC,
    '5at': TransmissionType.AUTOMATIC,
    '6at': TransmissionType.AUTOMATIC,
    автоматическая: TransmissionType.AUTOMATIC,
    акпп: TransmissionType.AUTOMATIC,
    automatic: TransmissionType.AUTOMATIC,
    auto: TransmissionType.AUTOMATIC,
    ac: TransmissionType.AUTOMATIC,
    ca: TransmissionType.AUTOMATIC,
    da: TransmissionType.AUTOMATIC,
    fa: TransmissionType.AUTOMATIC,
    ia: TransmissionType.AUTOMATIC,
    aac: TransmissionType.AUTOMATIC,

    // Вариатор (CVT - Continuously Variable Transmission)
    cvt: TransmissionType.CVT,
    fcvt: TransmissionType.CVT,
    вариатор: TransmissionType.CVT,

    // Роботизированная коробка передач
    amt: TransmissionType.ROBOT,
    dsg: TransmissionType.ROBOT,
    pdk: TransmissionType.ROBOT,
    робот: TransmissionType.ROBOT,
    роботизированная: TransmissionType.ROBOT,
    robot: TransmissionType.ROBOT,

    // Специальные обозначения с количеством передач
    '4': TransmissionType.AUTOMATIC, // чаще всего 4-ступенчатый автомат
    '5': TransmissionType.MANUAL, // чаще всего 5-ступенчатая механика
    '6': TransmissionType.AUTOMATIC, // чаще всего 6-ступенчатый автомат

    // Комбинированные обозначения
    '4f': TransmissionType.MANUAL,
    '5f': TransmissionType.MANUAL,
    '6f': TransmissionType.MANUAL,
    f4: TransmissionType.MANUAL,
    f5: TransmissionType.MANUAL,
    f6: TransmissionType.MANUAL,
    f7: TransmissionType.MANUAL,

    '4d': TransmissionType.ROBOT,
    '5d': TransmissionType.ROBOT,
    '6d': TransmissionType.ROBOT,
    d4: TransmissionType.ROBOT,
    d5: TransmissionType.ROBOT,
    d6: TransmissionType.ROBOT,

    '4c': TransmissionType.AUTOMATIC,
    '5c': TransmissionType.AUTOMATIC,
    '6c': TransmissionType.AUTOMATIC,
    c4: TransmissionType.AUTOMATIC,
    c5: TransmissionType.AUTOMATIC,
    c6: TransmissionType.AUTOMATIC,

    // Обозначения I-CVT (Intelligent CVT)
    i4: TransmissionType.CVT,
    i5: TransmissionType.CVT,
    i6: TransmissionType.CVT,
    'i-4': TransmissionType.CVT,
    'i-5': TransmissionType.CVT,
    'i-6': TransmissionType.CVT,

    // Дополнительные вариации
    fm: TransmissionType.MANUAL,
  };

  /**
   * Добавляет новый тип трансмиссии в словарь
   */
  addTransmission(variant: string, type: TransmissionType): void {
    this.transmissionDictionary[variant.toLowerCase().trim()] = type;
  }

  /**
   * Добавляет несколько типов трансмиссии в словарь
   */
  addTransmissions(transmissions: TransmissionMap): void {
    Object.entries(transmissions).forEach(([variant, type]) => {
      this.addTransmission(variant, type);
    });
  }

  /**
   * Очищает строку от HTML-сущностей и мусора
   */
  private cleanString(input: string): string {
    let cleaned = input.trim().toLowerCase();

    // Удаляем HTML-сущности (например, &#65412;&#65400;)
    cleaned = cleaned.replace(/&#\d+;/g, '');

    // Удаляем специальные символы, кроме дефисов
    cleaned = cleaned.replace(/[^\w\d\-]/g, '');

    // Очищаем лишние дефисы и пробелы
    cleaned = cleaned.replace(/\s+/g, '').replace(/^-+|-+$/g, '');

    return cleaned;
  }

  /**
   * Определяет тип трансмиссии по паттернам
   */
  private detectByPattern(text: string): TransmissionType | null {
    const cleanText = text.toLowerCase();

    // Паттерны для CVT (I-система обычно означает интеллектуальный CVT)
    if (/^i-?\d$/.test(cleanText)) {
      return TransmissionType.CVT;
    }

    // Паттерны для механики (F часто означает Floor shift = механика)
    if (/^(f\d|d\d?mt|\dmt|\df)$/.test(cleanText)) {
      return TransmissionType.MANUAL;
    }

    // Паттерны для автомата
    if (/^(\d?[cdat]|\d?at|ac|\d[cd])$/.test(cleanText)) {
      return TransmissionType.AUTOMATIC;
    }

    // CVT паттерны
    if (/cvt/.test(cleanText)) {
      return TransmissionType.CVT;
    }

    return null;
  }

  /**
   * Определяет тип по количеству передач (эвристика)
   */
  private guessByGearCount(gearCount: string): TransmissionType | null {
    const count = parseInt(gearCount);

    if (isNaN(count)) return null;

    // Эвристические правила
    if (count <= 3) {
      return TransmissionType.MANUAL; // Старые механики
    } else if (count === 4) {
      return TransmissionType.AUTOMATIC; // 4AT более распространен чем 4MT
    } else if (count === 5) {
      return TransmissionType.MANUAL; // 5MT очень распространена
    } else if (count >= 6) {
      return TransmissionType.AUTOMATIC; // Современные многоступенчатые автоматы
    }

    return null;
  }

  /**
   * Нормализует тип трансмиссии
   */
  normalize(transmissionInput: string): TransmissionType | null {
    if (!transmissionInput || transmissionInput.trim() === '') {
      return null;
    }

    // Очищаем строку
    const cleaned = this.cleanString(transmissionInput);

    if (!cleaned) {
      return null;
    }

    // Ищем точное совпадение в словаре
    if (this.transmissionDictionary.hasOwnProperty(cleaned)) {
      return this.transmissionDictionary[cleaned];
    }

    // Пробуем найти по паттернам
    const detectedByPattern = this.detectByPattern(cleaned);
    if (detectedByPattern) {
      return detectedByPattern;
    }

    // Если это просто число, пробуем угадать по количеству передач
    if (/^\d+$/.test(cleaned)) {
      const guessed = this.guessByGearCount(cleaned);
      if (guessed) {
        return guessed;
      }
    }

    return null;
  }

  /**
   * Нормализует массив типов трансмиссии
   */
  normalizeArray(transmissions: string[]): (TransmissionType | null)[] {
    return transmissions.map((transmission) => this.normalize(transmission));
  }

  /**
   * Нормализует массив, исключая null значения
   */
  normalizeArrayFiltered(transmissions: string[]): TransmissionType[] {
    return transmissions
      .map((transmission) => this.normalize(transmission))
      .filter((type): type is TransmissionType => type !== null);
  }

  /**
   * Получает статистику по типам трансмиссии
   */
  getTransmissionStats(transmissions: string[]): { [key in TransmissionType]: number } & { unknown: number } {
    const stats = {
      [TransmissionType.MANUAL]: 0,
      [TransmissionType.AUTOMATIC]: 0,
      [TransmissionType.CVT]: 0,
      [TransmissionType.ROBOT]: 0,
      unknown: 0,
    };

    transmissions.forEach((transmission) => {
      const normalized = this.normalize(transmission);
      if (normalized) {
        stats[normalized]++;
      } else if (transmission && transmission.trim()) {
        stats.unknown++;
      }
    });

    return stats;
  }

  /**
   * Получает текущий словарь трансмиссий
   */
  getTransmissionDictionary(): TransmissionMap {
    return { ...this.transmissionDictionary };
  }

  /**
   * Получает все возможные типы трансмиссии
   */
  getAvailableTypes(): TransmissionType[] {
    return Object.values(TransmissionType);
  }
}
