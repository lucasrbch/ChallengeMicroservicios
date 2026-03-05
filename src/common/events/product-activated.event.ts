export class ProductActivatedEvent {
  constructor(
    public readonly productId: number,
    public readonly title: string,
  ) {}
}