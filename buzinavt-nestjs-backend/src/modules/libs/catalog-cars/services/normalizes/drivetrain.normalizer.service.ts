enum DrivetrainType {
  FF = 'передний привод', // Front engine, Front wheel drive
  FR = 'задний привод', // Front engine, Rear wheel drive
  MIDSHIP = 'средний привод', // Mid engine
  AWD = 'полный привод', // All Wheel Drive
  FULLTIME_4WD = 'постоянный полный привод', // Full-time 4WD
  PARTTIME_4WD = 'подключаемый полный привод', // Part-time 4WD
}

interface DrivetrainMap {
  [key: string]: DrivetrainType;
}

export class DrivetrainNormalizer {
  private drivetrainPrimary: Record<DrivetrainType, number> = {
    [DrivetrainType.FF]: 3,
    [DrivetrainType.FR]: 3,
    [DrivetrainType.MIDSHIP]: 2,
    [DrivetrainType.FULLTIME_4WD]: 2,
    [DrivetrainType.AWD]: 1,
    [DrivetrainType.PARTTIME_4WD]: 1,
  };
  private drivetrainDictionary: DrivetrainMap = {
    // Передний привод (Front-Front)
    ff: DrivetrainType.FF,
    fwd: DrivetrainType.FF,
    front: DrivetrainType.FF,
    передний: DrivetrainType.FF,
    'передний привод': DrivetrainType.FF,
    переднеприводный: DrivetrainType.FF,
    переднеприводная: DrivetrainType.FF,
    переднеприводное: DrivetrainType.FF,

    // Задний привод (Front-Rear, Rear-Rear)
    fr: DrivetrainType.FR,
    rr: DrivetrainType.FR, // Но будем нормализовать к заднему приводу
    rwd: DrivetrainType.FR,
    rear: DrivetrainType.FR,
    задний: DrivetrainType.FR,
    'задний привод': DrivetrainType.FR,
    заднеприводный: DrivetrainType.FR,
    заднеприводная: DrivetrainType.FR,
    заднеприводное: DrivetrainType.FR,

    // Средний привод (Mid-engine)
    midship: DrivetrainType.MIDSHIP,
    mid: DrivetrainType.MIDSHIP,
    mr: DrivetrainType.MIDSHIP,
    средний: DrivetrainType.MIDSHIP,
    'средний привод': DrivetrainType.MIDSHIP,
    среднемоторный: DrivetrainType.MIDSHIP,

    // Полный привод общий
    awd: DrivetrainType.AWD,
    '4wd': DrivetrainType.AWD,
    полный: DrivetrainType.AWD,
    'полный привод': DrivetrainType.AWD,
    полноприводный: DrivetrainType.AWD,
    полноприводная: DrivetrainType.AWD,
    полноприводное: DrivetrainType.AWD,
    '4x4': DrivetrainType.AWD,

    // Постоянный полный привод
    fulltime4wd: DrivetrainType.FULLTIME_4WD,
    'fulltime 4wd': DrivetrainType.FULLTIME_4WD,
    'full time 4wd': DrivetrainType.FULLTIME_4WD,
    'постоянный полный': DrivetrainType.FULLTIME_4WD,
    'постоянный полный привод': DrivetrainType.FULLTIME_4WD,
    постоянный: DrivetrainType.FULLTIME_4WD,

    // Подключаемый полный привод
    parttime4wd: DrivetrainType.PARTTIME_4WD,
    'parttime 4wd': DrivetrainType.PARTTIME_4WD,
    'part time 4wd': DrivetrainType.PARTTIME_4WD,
    'part-time 4wd': DrivetrainType.PARTTIME_4WD,
    'подключаемый полный': DrivetrainType.PARTTIME_4WD,
    'подключаемый полный привод': DrivetrainType.PARTTIME_4WD,
    подключаемый: DrivetrainType.PARTTIME_4WD,
    'временный полный': DrivetrainType.PARTTIME_4WD,
  };

  /**
   * Добавляет новый тип привода в словарь
   */
  addDrivetrain(variant: string, type: DrivetrainType): void {
    this.drivetrainDictionary[variant.toLowerCase().trim()] = type;
  }

  /**
   * Добавляет несколько типов привода в словарь
   */
  addDrivetrains(drivetrains: DrivetrainMap): void {
    Object.entries(drivetrains).forEach(([variant, type]) => {
      this.addDrivetrain(variant, type);
    });
  }

  /**
   * Очищает строку от мусора
   */
  private cleanString(input: string): string {
    let cleaned = input.trim().toLowerCase();

    // Удаляем лишние пробелы и заменяем на подчеркивания для составных названий
    cleaned = cleaned.replace(/\s+/g, '');

    return cleaned;
  }

  /**
   * Разбирает составную строку с несколькими типами привода
   */
  private parseMultipleDrivetrains(input: string): DrivetrainType[] {
    // Разделители: запятая, точка с запятой, плюс
    const parts = input
      .split(/[,;+]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    const results: DrivetrainType[] = [];

    parts.forEach((part) => {
      const normalized = this.normalizeSingle(part);
      if (normalized && !results.includes(normalized)) {
        results.push(normalized);
      }
    });

    return results;
  }

  /**
   * Нормализует один тип привода
   */
  private normalizeSingle(drivetrainInput: string): DrivetrainType | null {
    if (!drivetrainInput || drivetrainInput.trim() === '') {
      return null;
    }

    // Очищаем строку
    const cleaned = this.cleanString(drivetrainInput);

    if (!cleaned) {
      return null;
    }

    // Ищем точное совпадение в словаре
    if (this.drivetrainDictionary.hasOwnProperty(cleaned)) {
      return this.drivetrainDictionary[cleaned];
    }

    // Пробуем найти частичные совпадения
    for (const [key, value] of Object.entries(this.drivetrainDictionary)) {
      if (cleaned.includes(key) || key.includes(cleaned)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Нормализует тип привода (может вернуть несколько типов для составных обозначений)
   */
  normalize(drivetrainInput: string): DrivetrainType[] {
    if (!drivetrainInput || drivetrainInput.trim() === '') {
      return [];
    }

    // Если есть запятые или другие разделители, обрабатываем как составное
    if (/[,;+]/.test(drivetrainInput)) {
      return this.parseMultipleDrivetrains(drivetrainInput);
    }

    // Обрабатываем как одиночный тип
    const single = this.normalizeSingle(drivetrainInput);
    return single ? [single] : [];
  }

  /**
   * Нормализует и возвращает основной тип привода (первый из списка)
   */
  normalizePrimary(drivetrainInput: string): DrivetrainType | null {
    const normalized = this.normalize(drivetrainInput).sort((a, b) => {
      return this.drivetrainPrimary[a] - this.drivetrainPrimary[b];
    });
    return normalized.length > 0 ? normalized[0] : null;
  }

  /**
   * Нормализует массив типов привода
   */
  normalizeArray(drivetrains: string[]): DrivetrainType[][] {
    return drivetrains.map((drivetrain) => this.normalize(drivetrain));
  }

  /**
   * Нормализует массив, возвращая только основные типы
   */
  normalizeArrayPrimary(drivetrains: string[]): (DrivetrainType | null)[] {
    return drivetrains.map((drivetrain) => this.normalizePrimary(drivetrain));
  }

  /**
   * Определяет, является ли привод полным (любого типа)
   */
  isAllWheelDrive(drivetrainInput: string): boolean {
    const normalized = this.normalize(drivetrainInput);
    return normalized.some(
      (type) =>
        type === DrivetrainType.AWD || type === DrivetrainType.FULLTIME_4WD || type === DrivetrainType.PARTTIME_4WD
    );
  }

  /**
   * Получает текущий словарь приводов
   */
  getDrivetrainDictionary(): DrivetrainMap {
    return { ...this.drivetrainDictionary };
  }

  /**
   * Получает все возможные типы привода
   */
  getAvailableTypes(): DrivetrainType[] {
    return Object.values(DrivetrainType);
  }
}
