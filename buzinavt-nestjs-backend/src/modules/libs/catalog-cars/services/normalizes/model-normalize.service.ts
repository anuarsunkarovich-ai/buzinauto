export class ModelNormalizeService {
  public static toSlug(text: string): string {
    return text
      .trimEnd()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  public static toDisplay(model: string): string {
    // Список слов, которые не должны капитализироваться (кроме начала)
    const lowercaseWords = ['series'];
    const uppercaseWords = ['tf', 'ut', 'mio', 'van', 'max', 'low'];

    return model
      .trim()
      .replace(/[\-]+/g, ' ')
      .toLowerCase()
      .split(/\s+/) // Разбиваем по любым пробелам
      .map((word, index) => {
        // Первое слово всегда капитализируем
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }

        // Проверяем, нужно ли оставить слово в нижнем регистре
        if (lowercaseWords.includes(word)) {
          return word;
        }

        // Проверяем, нужно ли преобразовать слово в верхней регистр
        if (uppercaseWords.includes(word)) {
          return word.toUpperCase();
        }

        // Капитализируем первую букву
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
}
