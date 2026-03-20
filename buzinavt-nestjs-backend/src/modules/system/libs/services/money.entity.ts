import { BigNumber } from 'bignumber.js';

export class MoneyEntity {
  constructor(private readonly _amount: BigNumber) {}

  get amount(): BigNumber {
    return this._amount;
  }

  round() {
    return new MoneyEntity(this._amount.integerValue(BigNumber.ROUND_HALF_CEIL));
  }

  floor() {
    return new MoneyEntity(this._amount.integerValue(BigNumber.ROUND_FLOOR));
  }

  ceil() {
    return new MoneyEntity(this._amount.integerValue(BigNumber.ROUND_CEIL));
  }

  trunc() {
    return new MoneyEntity(this._amount.integerValue(BigNumber.ROUND_DOWN));
  }

  multiply(value: MoneyEntity): MoneyEntity {
    return new MoneyEntity(this._amount.multipliedBy(value.amount));
  }

  public static min(...args: Array<MoneyEntity>): MoneyEntity {
    return new MoneyEntity(BigNumber.minimum(...args.map((e) => e.amount)));
  }

  public static max(...args: Array<MoneyEntity>): MoneyEntity {
    return new MoneyEntity(BigNumber.max(...args.map((e) => e.amount)));
  }

  opposite(): MoneyEntity {
    return this.multiply(MoneyEntity.of(-1));
  }

  div(value: MoneyEntity): MoneyEntity {
    return new MoneyEntity(this._amount.div(value.amount));
  }

  pow(value: MoneyEntity): MoneyEntity {
    return new MoneyEntity(this._amount.pow(value.amount));
  }

  eq(value: MoneyEntity): boolean {
    return this._amount.eq(value.amount);
  }

  toNumber(): number {
    return +this._amount.toString();
  }

  toString(): string {
    return this._amount.toString();
  }

  fromWei(decimal: MoneyEntity): MoneyEntity {
    return new MoneyEntity(this._amount).div(MoneyEntity.ten.exponentiated(decimal));
  }

  toDecimal(decimal: MoneyEntity): MoneyEntity {
    return new MoneyEntity(this._amount).multiply(MoneyEntity.ten.exponentiated(decimal));
  }

  toFixed(n = 0): number {
    return +this._amount.toFixed(n);
  }

  exponentiated(value: MoneyEntity): MoneyEntity {
    return new MoneyEntity(this._amount.exponentiatedBy(value.amount));
  }

  gt(value: MoneyEntity) {
    return this._amount.gt(value.amount);
  }

  gte(value: MoneyEntity) {
    return this._amount.gte(value.amount);
  }

  lt(value: MoneyEntity) {
    return this._amount.lt(value.amount);
  }

  lte(value: MoneyEntity) {
    return this._amount.lte(value.amount);
  }

  minus(value: MoneyEntity) {
    return new MoneyEntity(this._amount.minus(value.amount));
  }

  plus(value: MoneyEntity) {
    return new MoneyEntity(this._amount.plus(value.amount));
  }

  negate() {
    return new MoneyEntity(this.amount.negated());
  }

  isPositiveOrZero() {
    return this.amount.comparedTo(0) >= 0;
  }

  static of(value: number | string) {
    BigNumber.config({ EXPONENTIAL_AT: 999 });
    return new MoneyEntity(new BigNumber(value ?? 0));
  }

  static get hundred() {
    return MoneyEntity.of(100);
  }

  static get zero() {
    return MoneyEntity.of(0);
  }

  static get one() {
    return MoneyEntity.of(1);
  }

  static get ten() {
    return MoneyEntity.of(10);
  }

  static add(a: MoneyEntity, b: MoneyEntity): MoneyEntity {
    return new MoneyEntity(a.amount.plus(b.amount));
  }
}
