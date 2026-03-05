export class ProductCreatedEvent {
  constructor(
    public readonly productId: number,
    public readonly title: string,
    public readonly code: string,
  ) {}
}