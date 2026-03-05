import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProductActivatedEvent } from '../../common/events/product-activated.event';
import { ProductCreatedEvent } from 'src/common/events/product-created.event';

@Injectable()
export class ProductSubscriber {
  private readonly logger = new Logger(ProductSubscriber.name);

  @OnEvent('product.activated', { async: true })
  handleProductActivatedEvent(event: ProductActivatedEvent) {
    this.logger.log(
      `Producto activado -> ID: ${event.productId} | Título: "${event.title}".`
    );
  }

  @OnEvent('product.created', { async: true })
  handleProductCreatedEvent(event: ProductCreatedEvent) {
    this.logger.log(`Nuevo producto ingresado al catálogo -> Código: ${event.code} | Título: "${event.title}"`);
  }
}