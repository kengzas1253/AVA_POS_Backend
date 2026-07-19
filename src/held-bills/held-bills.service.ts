import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, QueryFailedError, Repository } from 'typeorm';
import { CreateHeldBillDto } from './dto/create-held-bill.dto';
import { CreateHeldBillItemDto } from './dto/create-held-bill-item.dto';
import { UpdateHeldBillDto } from './dto/update-held-bill.dto';
import { UpdateHeldBillItemsDto } from './dto/update-held-bill-items.dto';
import { HeldBillItem } from './entities/held-bill-item.entity';
import { HeldBill, HeldBillStatus } from './entities/held-bill.entity';

@Injectable()
export class HeldBillsService {
  constructor(
    @InjectRepository(HeldBill)
    private readonly heldBillRepository: Repository<HeldBill>,
    @InjectRepository(HeldBillItem)
    private readonly heldBillItemRepository: Repository<HeldBillItem>,
    private readonly dataSource: DataSource,
  ) {}

  // Create a held bill and all items in one database transaction.
  async create(createHeldBillDto: CreateHeldBillDto) {
    try {
      await this.dataSource.transaction(async (manager) => {
        const heldBillRepository = manager.getRepository(HeldBill);
        const heldBillItemRepository = manager.getRepository(HeldBillItem);
        const totals = this.calculateTotals(createHeldBillDto);

        const heldBill = heldBillRepository.create({
          hold_no: await this.generateHoldNo(heldBillRepository),
          hold_name: createHeldBillDto.hold_name,
          customer_id: this.valueToString(createHeldBillDto.customer_id),
          machine_id: createHeldBillDto.machine_id,
          user_id: createHeldBillDto.user_id,
          item_count: createHeldBillDto.items.length,
          total_qty: totals.total_qty,
          subtotal_amount: totals.subtotal_amount,
          discount_amount: totals.discount_amount,
          tax_amount: 0,
          total_amount: totals.total_amount,
          status: HeldBillStatus.HELD,
          note: createHeldBillDto.note ?? null,
        });

        const savedHeldBill = await heldBillRepository.save(heldBill);
        const items = this.createHeldBillItemEntities(
          heldBillItemRepository,
          savedHeldBill.id,
          createHeldBillDto.items,
        );

        await heldBillItemRepository.save(items);
      });

      return {
        success: true,
        message: 'Hold bill created successfully',
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // List only held bills ordered by newest first.
  findAllHeld() {
    return this.heldBillRepository.find({
      select: {
        id: true,
        hold_no: true,
        hold_name: true,
        customer_id: true,
        item_count: true,
        total_qty: true,
        total_amount: true,
        machine_id: true,
        user_id: true,
        created_at: true,
      },
      where: { status: HeldBillStatus.HELD },
      order: { created_at: 'DESC' },
    });
  }

  // Get one held bill with product items using TypeORM relations.
  async findOne(id: string) {
    const heldBill = await this.heldBillRepository.findOne({
      where: { id },
      relations: { items: true },
      order: { items: { id: 'ASC' } },
    });

    if (!heldBill) {
      throw new NotFoundException('Held bill not found');
    }

    return heldBill;
  }

  // Restore a held bill for cart usage without changing its status.
  async restore(id: string) {
    const heldBill = await this.heldBillRepository.findOne({
      where: { id },
      relations: { items: true },
      order: { items: { id: 'ASC' } },
    });

    if (!heldBill) {
      throw new NotFoundException('Held bill not found');
    }

    this.ensureHeldStatus(heldBill);

    return {
      success: true,
      message: 'Hold bill restored successfully',
      data: {
        id: heldBill.id,
        hold_no: heldBill.hold_no,
        hold_name: heldBill.hold_name,
        customer_id: heldBill.customer_id,
        machine_id: heldBill.machine_id,
        user_id: heldBill.user_id,
        item_count: heldBill.item_count,
        total_qty: heldBill.total_qty,
        total_amount: heldBill.total_amount,
        items: heldBill.items.map((item) => ({
          product_id: item.product_id,
          barcode: item.barcode,
          product_name: item.product_name,
          qty: item.qty,
          unit_price: item.unit_price,
          total_amount: item.total_amount,
        })),
      },
    };
  }

  // Update held bill name.
  async update(id: string, updateHeldBillDto: UpdateHeldBillDto) {
    const heldBill = await this.heldBillRepository.preload({
      id,
      hold_name: updateHeldBillDto.hold_name,
    });

    if (!heldBill) {
      throw new NotFoundException('Held bill not found');
    }

    await this.heldBillRepository.save(heldBill);

    return {
      success: true,
      message: 'Hold bill updated successfully',
    };
  }

  // Replace a held bill's items and recalculate totals in one transaction.
  async updateItems(id: string, updateHeldBillItemsDto: UpdateHeldBillItemsDto) {
    const heldBill = await this.heldBillRepository.findOne({ where: { id } });

    if (!heldBill) {
      throw new NotFoundException('Held bill not found');
    }

    this.ensureHeldStatus(heldBill);

    try {
      await this.dataSource.transaction(async (manager) => {
        const heldBillRepository = manager.getRepository(HeldBill);
        const heldBillItemRepository = manager.getRepository(HeldBillItem);
        const totals = this.calculateTotals(updateHeldBillItemsDto);

        await heldBillRepository.save({
          ...heldBill,
          hold_name: updateHeldBillItemsDto.hold_name ?? heldBill.hold_name,
          item_count: updateHeldBillItemsDto.items.length,
          total_qty: totals.total_qty,
          subtotal_amount: totals.subtotal_amount,
          discount_amount: totals.discount_amount,
          tax_amount: 0,
          total_amount: totals.total_amount,
          updated_at: new Date(),
        });

        await heldBillItemRepository.delete({ held_bill_id: id });
        await heldBillItemRepository.save(
          this.createHeldBillItemEntities(
            heldBillItemRepository,
            id,
            updateHeldBillItemsDto.items,
          ),
        );
      });

      return {
        success: true,
        message: 'Hold bill updated successfully',
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // Cancel a held bill without deleting header or item records.
  async cancel(id: string) {
    const heldBill = await this.heldBillRepository.findOne({ where: { id } });

    if (!heldBill) {
      throw new NotFoundException('Held bill not found');
    }

    this.ensureHeldStatus(heldBill);

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(HeldBill).save({
        ...heldBill,
        status: HeldBillStatus.CANCELLED,
        cancelled_at: new Date(),
      });
    });

    return {
      success: true,
      message: 'Hold bill cancelled successfully',
    };
  }

  // Delete held bill items first, then delete the bill in one transaction.
  async remove(id: string) {
    const heldBill = await this.heldBillRepository.findOne({ where: { id } });

    if (!heldBill) {
      throw new NotFoundException('Held bill not found');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(HeldBillItem).delete({ held_bill_id: id });
      await manager.getRepository(HeldBill).delete({ id });
    });

    return {
      success: true,
      message: 'Hold bill deleted successfully',
    };
  }

  private createHeldBillItemEntities(
    repository: Repository<HeldBillItem>,
    heldBillId: string,
    items: CreateHeldBillItemDto[],
  ) {
    return items.map((item) =>
      repository.create({
        held_bill_id: heldBillId,
        product_id: item.product_id.toString(),
        sku: item.sku ?? null,
        barcode: item.barcode ?? null,
        product_name: item.product_name,
            category_id: this.valueToString(item.category_id),
        unit_code: item.unit_code ?? null,
        price_mode: item.price_mode,
        qty: item.qty,
        cost_price: item.cost_price ?? 0,
        sale_price: item.sale_price ?? 0,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount ?? 0,
        total_amount:
          item.total_amount ??
          this.roundMoney(
            item.qty * item.unit_price - (item.discount_amount ?? 0),
          ),
        track_stock: item.track_stock ?? true,
        allow_discount: item.allow_discount ?? true,
        image_url: item.image_url ?? null,
        note: item.note ?? null,
      }),
    );
  }

  private async generateHoldNo(repository: Repository<HeldBill>) {
    const prefix = `HB${this.formatDate(new Date())}`;
    const latestHeldBill = await repository.findOne({
      where: { hold_no: Like(`${prefix}%`) },
      order: { hold_no: 'DESC' },
    });
    const latestSequence = latestHeldBill
      ? Number(latestHeldBill.hold_no.slice(-4))
      : 0;

    return `${prefix}${(latestSequence + 1).toString().padStart(4, '0')}`;
  }

  private calculateTotals(
    heldBillDto: Pick<CreateHeldBillDto | UpdateHeldBillItemsDto, 'items'>,
  ) {
    return heldBillDto.items.reduce(
      (totals, item) => {
        const discountAmount = item.discount_amount ?? 0;
        const totalAmount =
          item.total_amount ??
          this.roundMoney(item.qty * item.unit_price - discountAmount);

        return {
          total_qty: this.roundQty(totals.total_qty + item.qty),
          subtotal_amount: this.roundMoney(
            totals.subtotal_amount + item.qty * item.unit_price,
          ),
          discount_amount: this.roundMoney(
            totals.discount_amount + discountAmount,
          ),
          total_amount: this.roundMoney(totals.total_amount + totalAmount),
        };
      },
      {
        total_qty: 0,
        subtotal_amount: 0,
        discount_amount: 0,
        total_amount: 0,
      },
    );
  }

  private formatDate(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}${month}${day}`;
  }

  private valueToString(value?: number | string | null) {
    return value === undefined || value === null ? null : value.toString();
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }

  private roundQty(value: number) {
    return Math.round(value * 1000) / 1000;
  }

  private ensureHeldStatus(heldBill: HeldBill) {
    if (heldBill.status !== HeldBillStatus.HELD) {
      throw new BadRequestException('Held bill status is not HELD');
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string };

      if (driverError.code === '23505') {
        throw new ConflictException('Hold bill number already exists');
      }

      if (driverError.code === '23503') {
        throw new BadRequestException('Held bill data references invalid data');
      }
    }

    throw error;
  }
}
