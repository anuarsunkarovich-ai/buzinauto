enum SaleStatus {
  SOLD = 'продан',
  NOT_SOLD = 'не продан',
  CANCELLED = 'отменён',
}

interface StatusMap {
  [key: string]: SaleStatus;
}

export class SaleStatusNormalizerService {
  private statusDictionary: StatusMap = {
    // Продано
    sold: SaleStatus.SOLD,
    продан: SaleStatus.SOLD,
    продана: SaleStatus.SOLD,
    продано: SaleStatus.SOLD,
    проданы: SaleStatus.SOLD,
    'sold by nego': SaleStatus.SOLD,
    'sold by negotiation': SaleStatus.SOLD,
    'продан после': SaleStatus.SOLD,
    'продан по договоренности': SaleStatus.SOLD,
    реализован: SaleStatus.SOLD,
    реализовано: SaleStatus.SOLD,

    // Не продано
    'not sold': SaleStatus.NOT_SOLD,
    'не продан': SaleStatus.NOT_SOLD,
    'не продана': SaleStatus.NOT_SOLD,
    'не продано': SaleStatus.NOT_SOLD,
    'не проданы': SaleStatus.NOT_SOLD,
    unsold: SaleStatus.NOT_SOLD,
    available: SaleStatus.NOT_SOLD,
    доступен: SaleStatus.NOT_SOLD,
    доступна: SaleStatus.NOT_SOLD,
    доступно: SaleStatus.NOT_SOLD,
    'в наличии': SaleStatus.NOT_SOLD,
    активный: SaleStatus.NOT_SOLD,
    активная: SaleStatus.NOT_SOLD,
    активное: SaleStatus.NOT_SOLD,

    // Отменено/Снято с продажи
    cancelled: SaleStatus.CANCELLED,
    canceled: SaleStatus.CANCELLED,
    removed: SaleStatus.CANCELLED,
    отменён: SaleStatus.CANCELLED,
    отменена: SaleStatus.CANCELLED,
    отменено: SaleStatus.CANCELLED,
    отменены: SaleStatus.CANCELLED,
    снят: SaleStatus.CANCELLED,
    снята: SaleStatus.CANCELLED,
    снято: SaleStatus.CANCELLED,
    сняты: SaleStatus.CANCELLED,
    'снят с продажи': SaleStatus.CANCELLED,
    'снята с продажи': SaleStatus.CANCELLED,
    'снято с продажи': SaleStatus.CANCELLED,
    'сняты с продажи': SaleStatus.CANCELLED,
    удален: SaleStatus.CANCELLED,
    удалена: SaleStatus.CANCELLED,
    удалено: SaleStatus.CANCELLED,
    удалены: SaleStatus.CANCELLED,
    закрыт: SaleStatus.CANCELLED,
    закрыта: SaleStatus.CANCELLED,
    закрыто: SaleStatus.CANCELLED,
    закрыты: SaleStatus.CANCELLED,
    неактивный: SaleStatus.CANCELLED,
    неактивная: SaleStatus.CANCELLED,
    неактивное: SaleStatus.CANCELLED,
  };

  private junkWords = ['after', 'после', 'by', 'через', 'via', 'with', 'с', 'на', 'в', 'по'];

  /**
   * Добавляет новый статус в словарь
   */
  addStatus(statusVariant: string, normalizedStatus: SaleStatus): void {
    this.statusDictionary[statusVariant.toLowerCase().trim()] = normalizedStatus;
  }

  /**
   * Добавляет несколько статусов в словарь
   */
  addStatuses(statuses: StatusMap): void {
    Object.entries(statuses).forEach(([variant, status]) => {
      this.addStatus(variant, status);
    });
  }

  /**
   * Очищает строку от мусорных слов
   */
  private cleanJunk(statusString: string): string {
    let cleaned = statusString.trim().toLowerCase();

    // Удаляем мусорные слова в конце
    this.junkWords.forEach((word) => {
      const regex = new RegExp(`\\s+${word}\\s*$`, 'gi');
      cleaned = cleaned.replace(regex, '');
    });

    // Очищаем лишние пробелы
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Определяет статус по ключевым словам
   */
  private detectByKeywords(text: string): SaleStatus | null {
    const lowerText = text.toLowerCase();

    // Проверяем на продажу
    if (lowerText.includes('продан') || lowerText.includes('sold') || lowerText.includes('реализован')) {
      return SaleStatus.SOLD;
    }

    // Проверяем на отмену/снятие
    if (
      lowerText.includes('отмен') ||
      lowerText.includes('снят') ||
      lowerText.includes('cancel') ||
      lowerText.includes('removed') ||
      lowerText.includes('удален') ||
      lowerText.includes('закрыт')
    ) {
      return SaleStatus.CANCELLED;
    }

    // Проверяем на "не продан"
    if (
      lowerText.includes('не продан') ||
      lowerText.includes('not sold') ||
      lowerText.includes('доступен') ||
      lowerText.includes('available')
    ) {
      return SaleStatus.NOT_SOLD;
    }

    return null;
  }

  /**
   * Нормализует статус продажи
   */
  normalize(statusInput: string): SaleStatus | null {
    if (!statusInput || statusInput.trim() === '') {
      return null;
    }

    // Очищаем от мусора
    const cleaned = this.cleanJunk(statusInput);

    if (!cleaned) {
      return null;
    }

    // Ищем точное совпадение в словаре
    if (this.statusDictionary.hasOwnProperty(cleaned)) {
      return this.statusDictionary[cleaned];
    }

    // Пробуем найти по ключевым словам
    const detectedStatus = this.detectByKeywords(cleaned);
    if (detectedStatus) {
      return detectedStatus;
    }

    // Если ничего не найдено, возвращаем null
    return null;
  }

  /**
   * Нормализует массив статусов
   */
  normalizeArray(statuses: string[]): (SaleStatus | null)[] {
    return statuses.map((status) => this.normalize(status));
  }

  /**
   * Нормализует массив статусов, исключая null значения
   */
  normalizeArrayFiltered(statuses: string[]): SaleStatus[] {
    return statuses.map((status) => this.normalize(status)).filter((status): status is SaleStatus => status !== null);
  }

  /**
   * Получает текущий словарь статусов
   */
  getStatusDictionary(): StatusMap {
    return { ...this.statusDictionary };
  }

  /**
   * Получает все возможные нормализованные статусы
   */
  getAvailableStatuses(): SaleStatus[] {
    return Object.values(SaleStatus);
  }
}
