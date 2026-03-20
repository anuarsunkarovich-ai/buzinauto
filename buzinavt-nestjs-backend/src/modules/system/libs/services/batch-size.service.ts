type TOverflowPackageFC<T> = (items: T[]) => void | Promise<void>;

/**
 * Сервис для обработки данных пакетами фиксированного размера.
 * Позволяет подписываться на события переполнения буфера и
 * обрабатывать элементы по достижении установленного лимита.
 */
export class BatchSizeService<T> {
  /** Внутренний буфер для хранения элементов до обработки */
  private _bufferItems: T[] = [];

  /** Подписанные функции-обработчики для переполненных пакетов */
  private readonly _signedFc: TOverflowPackageFC<T>[] = [];

  /**
   * @param _countPackage Количество элементов в пакете, после которого происходит обработка
   */
  constructor(private readonly _countPackage: number) {
    this._bufferItems = [];
    this._signedFc = [];
  }

  /**
   * Подписывает функцию-обработчик для обработки пакета элементов.
   *
   * @param overflowPackageFC Функция, которая будет вызвана при переполнении буфера
   */
  public on(overflowPackageFC: TOverflowPackageFC<T>) {
    this._signedFc.push(overflowPackageFC);
  }

  /**
   * Добавляет новый элемент в буфер. Если количество элементов
   * в буфере достигает заданного лимита, вызывает подписанные функции.
   *
   * @param item Новый элемент для добавления в буфер
   */
  public async next(item: T) {
    this._bufferItems.push(item);
    if (this._bufferItems.length >= this._countPackage) {
      await this._runAllFc(this._bufferItems);
      this._bufferItems = [];
    }
  }

  /**
   * Принудительно обрабатывает оставшиеся элементы в буфере.
   * Вызывается при завершении работы сервиса.
   */
  public async end() {
    if (this._bufferItems.length === 0) return;
    await this._runAllFc(this._bufferItems);
    this._bufferItems = [];
  }

  /**
   * Выполняет все подписанные функции-обработчики для переданных элементов.
   *
   * @param items Массив элементов для обработки
   */
  private async _runAllFc(items: T[]) {
    for (const fc of this._signedFc) {
      await fc(items);
    }
  }
}
