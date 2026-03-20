export class TextFormateService {
  constructor(private _text?: string) {}
  public get text(): string {
    return this._text;
  }
  public camelCaseToSentence(text?: string) {
    const _t = text ?? this._text;
    this._text = _t
      .replace(/([A-Z][a-z]+)/gm, ' $1')
      .toLowerCase()
      .replace(/^\s/gm, '');
    return this;
  }
  public upperSentence(text?: string) {
    const _t = text ?? this._text;
    this._text = _t.charAt(0).toUpperCase() + _t.slice(1);
    return this;
  }

  public static transformEmailToUsername(email: string): string {
    const username = email.split('@')[0];
    return username.replace(/[^a-zA-Z0-9]/g, '');
  }
}
