interface ColorMap {
  [key: string]: string;
}

export class ColorNormalizerService {
  private colorDictionary: ColorMap = {
    // Основные цвета
    white: 'белый',
    black: 'черный',
    red: 'красный',
    blue: 'синий',
    green: 'зеленый',
    yellow: 'желтый',
    orange: 'оранжевый',
    purple: 'фиолетовый',
    pink: 'розовый',
    brown: 'коричневый',
    gray: 'серый',
    grey: 'серый',
    silver: 'серебристый',
    gold: 'золотой',
    beige: 'бежевый',

    // Оттенки и сложные цвета
    mint: 'мятный',
    khaki: 'хаки',
    bordeaux: 'бордовый',
    wine: 'винный',
    bronze: 'бронзовый',
    vanilla: 'ванильный',
    ivory: 'слоновая кость',
    pearl: 'жемчужный',
    maroon: 'бордовый',
    rose: 'розовый',
    lavender: 'лавандовый',
    lavander: 'лавандовый', // исправляем опечатку
    turquoise: 'бирюзовый',
    lime: 'лаймовый',
    sand: 'песочный',
    charcoal: 'угольный',
    indigo: 'индиго',
    aqua: 'аква',
    tea: 'чайный',
    mocha: 'мокко',
    chocolate: 'шоколадный',
    chocolat: 'шоколадный',
    cream: 'кремовый',
    olive: 'оливковый',
    marine: 'морской',
    ocean: 'океанский',
    sky: 'небесный',
    steel: 'стальной',
    titanium: 'титановый',
    gun: 'оружейный',
    metal: 'металлический',
    metallic: 'металлик',
    sapphire: 'сапфировый',
    amethyst: 'аметистовый',
    dawn: 'рассветный',
    sonic: 'соник',
    silky: 'шелковистый',
    satin: 'атласный',
    matt: 'матовый',
    matte: 'матовый',
    taffeta: 'тафта',
    premium: 'премиум',
    bitter: 'горький',
    plum: 'сливовый',
    cherry: 'вишневый',
    denim: 'джинсовый',
    antique: 'антикварный',
    warm: 'теплый',
    cool: 'прохладный',
    bright: 'яркий',
    light: 'светлый',
    dark: 'темный',
    pale: 'бледный',
    medium: 'средний',
    high: 'высокий',
  };

  private junkWords = [
    'super',
    'two-tone',
    'tone',
    'shell',
    'sword',
    'specified',
    'color',
    'colour',
    'chameleon',
    'beans',
    'mokoberi',
    'con',
    'other',
    'm',
    'l',
  ];

  private junkPatterns = [
    /\s+\d+$/, // цифры в конце (например, "2", "two")
    /\btwo\b/i, // слово "two"
    /\b\d+\b/g, // любые отдельные цифры
  ];

  /**
   * Добавляет новый цвет в словарь
   */
  addColor(englishColor: string, russianColor: string): void {
    this.colorDictionary[englishColor.toLowerCase()] = russianColor;
  }

  /**
   * Добавляет несколько цветов в словарь
   */
  addColors(colors: ColorMap): void {
    Object.entries(colors).forEach(([eng, rus]) => {
      this.addColor(eng, rus);
    });
  }

  /**
   * Очищает строку от мусора
   */
  private cleanJunk(colorString: string): string {
    let cleaned = colorString.trim();

    // Удаляем мусорные паттерны
    this.junkPatterns.forEach((pattern) => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Удаляем мусорные слова
    this.junkWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '');
    });

    // Очищаем лишние пробелы и дефисы
    cleaned = cleaned
      .replace(/\s+/g, ' ')
      .replace(/^[-\s]+|[-\s]+$/g, '')
      .trim();

    return cleaned;
  }

  /**
   * Переводит отдельное слово цвета
   */
  private translateWord(word: string): string {
    const lowerWord = word.toLowerCase();
    return this.colorDictionary[lowerWord] || word;
  }

  /**
   * Проверяет, является ли строка уже русской
   */
  private isRussian(text: string): boolean {
    return /[а-яё]/i.test(text);
  }

  /**
   * Нормализует цвет: очищает от мусора и переводит на русский
   */
  normalize(colorInput: string): string {
    if (!colorInput || colorInput.trim() === '') {
      return '';
    }

    // Очищаем от мусора
    const cleaned = this.cleanJunk(colorInput);

    if (!cleaned) {
      return '';
    }

    // Если уже на русском, возвращаем очищенную версию
    if (this.isRussian(cleaned)) {
      return cleaned.toLowerCase();
    }

    // Разбиваем на слова и переводим каждое
    const words = cleaned
      .toLowerCase()
      .split(/[-\s]+/)
      .filter((word) => word.length > 0);
    const translatedWords = words.map((word) => this.translateWord(word));

    // Собираем результат
    const result = translatedWords.join('-');

    return result || cleaned.toLowerCase();
  }

  /**
   * Нормализует массив цветов
   */
  normalizeArray(colors: string[]): string[] {
    return colors.map((color) => this.normalize(color)).filter((color) => color !== '');
  }

  /**
   * Получает текущий словарь цветов
   */
  getColorDictionary(): ColorMap {
    return { ...this.colorDictionary };
  }
}
