import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeleteResult, EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { CreateProductDto, ProductDetailsDto } from '../dto/product.dto';
import { Category } from '../../../database/entities/category.entity';
import { Product } from 'src/database/entities/product.entity';
import { errorMessages } from 'src/errors/custom';
import { validate } from 'class-validator';
import { successObject } from 'src/common/helper/sucess-response.interceptor';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductActivatedEvent } from 'src/common/events/product-activated.event';
import { ProductCreatedEvent } from 'src/common/events/product-created.event';
@Injectable()
export class ProductService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private eventEmitter: EventEmitter2,
  ) {}


  async getProduct(productId: number) {
    const product = await this.entityManager.findOne(Product, {
      where: {
        id: productId,
      },
    });

    if (!product) throw new NotFoundException(errorMessages.product.notFound);

    return product;
  }

  async createProduct(data: CreateProductDto, merchantId: number) {
    const category = await this.entityManager.findOne(Category, {
      where: {
        id: data.categoryId,
      },
    });

    if (!category) throw new NotFoundException(errorMessages.category.notFound);

    const product = this.entityManager.create(Product, {
      ...data, 
      category,
      merchantId,
    });

    const savedProduct = await this.entityManager.save(product);

    this.eventEmitter.emit(
      'product.created',
      new ProductCreatedEvent(savedProduct.id, savedProduct.title, savedProduct.code)
    );

    return savedProduct;
  }

async addProductDetails(
  productId: number,
  body: ProductDetailsDto,
  merchantId: number,
) {
  const result = await this.entityManager
    .createQueryBuilder()
    .update<Product>(Product)
    .set({
      title: body.title,
      code: body.code,
      description: body.description,
      variationType: body.variationType,
      details: body.details, 
      about: body.about,     
    })
    .where('id = :id', { id: productId })
    .andWhere('merchantId = :merchantId', { merchantId })
    .returning('*')
    .execute();

  if (result.affected < 1)
    throw new NotFoundException(errorMessages.product.notFound);

  return result.raw[0];
}
async activateProduct(productId: number, merchantId: number) {

     if (!(await this.validate(productId)))
       throw new ConflictException(errorMessages.product.notFulfilled);

    const result = await this.entityManager
      .createQueryBuilder()
      .update<Product>(Product)
      .set({
        isActive: true,
      })
      .where('id = :id', { id: productId })
      .andWhere('merchantId = :merchantId', { merchantId })
      .returning(['id', 'isActive', 'title']) 
      .execute();

    const activatedProduct = result.raw[0];

   if (activatedProduct) {
      this.eventEmitter.emit(
        'product.activated',
        new ProductActivatedEvent(activatedProduct.id, activatedProduct.title)
      );
    }

    return activatedProduct; // Retornamos lo mismo que antes
  }

  async validate(productId: number) {
    const product = await this.entityManager.findOne(Product, {
      where: {
        id: productId,
      },
    });
    if (!product) throw new NotFoundException(errorMessages.product.notFound);
    const errors = await validate(product);

    if (errors.length > 0) return false;

    return true;
  }

  async deleteProduct(productId: number, merchantId: number) {
    const result = await this.entityManager
      .createQueryBuilder()
      .delete()
      .from(Product)
      .where('id = :productId', { productId })
      .andWhere('merchantId = :merchantId', { merchantId })
      .execute();

    if (result.affected < 1)
      throw new NotFoundException(errorMessages.product.notFound);

    return successObject;
  }

  async getAllProducts() {
    return this.entityManager.find(Product);
  }
}
