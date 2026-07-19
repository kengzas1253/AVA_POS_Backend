import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = this.customerRepository.create(
      this.toEntityInput(createCustomerDto),
    );

    try {
      const savedCustomer = await this.customerRepository.save(customer);

      return {
        status: 'ok',
        message: 'Customer created successfully',
        data: savedCustomer,
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  findAll() {
    return this.customerRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: string) {
    const customer = await this.customerRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.customerRepository.preload({
      id,
      ...this.toEntityInput(updateCustomerDto),
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    try {
      await this.customerRepository.save(customer);

      return {
        status: 'ok',
        message: 'Customer updated successfully',
        data: await this.findOne(id),
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    const customer = await this.customerRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.customerRepository.remove(customer);

    return {
      status: 'ok',
      message: 'Customer deleted successfully',
      data: {
        id,
      },
    };
  }

  private toEntityInput(
    dto: CreateCustomerDto | UpdateCustomerDto,
  ): Partial<Customer> {
    return {
      ...dto,
      total_purchase_amount: dto.total_purchase_amount?.toString(),
    };
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as {
        code?: string;
        constraint?: string;
      };

      if (driverError.code === '23505') {
        throw new ConflictException('Customer code already exists');
      }
    }

    throw error;
  }
}
