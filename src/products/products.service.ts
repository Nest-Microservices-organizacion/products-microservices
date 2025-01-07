import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { PrismaClient } from '@prisma/client'
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('ProductsService')

  onModuleInit() {
    this.$connect();
    this.logger.log("Database connected")

  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto
    })
  }

  async findAll(paginationDto : PaginationDto) {
    const { page, limit } = paginationDto;

    const totalPages = await this.product.count({ where: { available: true } });
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          available: true,
        },
      }),
      meta: {
        total: totalPages,
        page: page,
        lastPage: lastPage,
      },
    };
  }

  async findOne(id: number) {

     try {
       return await this.product.findUniqueOrThrow({
         where: { id, available: true},
       });

     } catch (error) {
       if (
         error instanceof PrismaClientKnownRequestError &&
         error.code === 'P2025'
       ) {
         throw new NotFoundException(`Product with id #${id} not found`);
       }
       throw error; // Lanza el error original si no es un caso de "not found"
     }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id: __, ...data } = updateProductDto

    try {
      return await this.product.update({
        where: { id: id },
        data: data,
      });
    } catch (error) {
      throw new NotFoundException(`Product with id #${id} not found`)
    }    

  }

  async remove(id: number) {
    
    await this.findOne(id)

    /* return this.product.delete({  ==> eliminar directamente la informacion de la base de datos
      where: { id: id },
    }) */

    const product = this.product.update({
      where: { id},
      data: {
        available: false
      }
    })

    return product

  }
}
