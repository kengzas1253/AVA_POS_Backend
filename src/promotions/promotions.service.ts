import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { CalculatePromotionItemDto } from '../pos/dto/calculate-promotions.dto';
import {
  CreatePromotionDto,
  PromotionRuleDto,
} from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionProduct } from './entities/promotion-product.entity';
import { PromotionRule } from './entities/promotion-rule.entity';
import {
  Promotion,
  PromotionMixType,
  PromotionStatus,
  PromotionType,
} from './entities/promotion.entity';

type CartItemResult = {
  product_id: number;
  qty: number;
  unit_price: number;
  discount_amount: number;
  final_price: number;
};

type PromotionGroup = {
  items: CalculatePromotionItemDto[];
  qty: number;
  subtotal: number;
};

type PromotionPayload = {
  promotion_code: string;
  promotion_name: string;
  promotion_type: PromotionType;
  allow_mix?: boolean;
  mix_type?: PromotionMixType;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  priority?: number;
  can_combine?: boolean;
  status?: PromotionStatus;
  rules: PromotionRuleDto[];
  product_ids: number[];
};

type AppliedPromotionResult = {
  promotion_id: number;
  promotion_name: string;
  promotion_type: PromotionType;
  discount_amount: number;
  matched_qty: number;
};

@Injectable()
export class PromotionsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectRepository(PromotionRule)
    private readonly promotionRuleRepository: Repository<PromotionRule>,
    @InjectRepository(PromotionProduct)
    private readonly promotionProductRepository: Repository<PromotionProduct>,
  ) {}

  async create(createPromotionDto: CreatePromotionDto) {
    this.validatePromotionPayload(createPromotionDto);
    await this.ensurePromotionCodeAvailable(createPromotionDto.promotion_code);

    try {
      const promotion = await this.dataSource.transaction(async (manager) => {
        const savedPromotion = await manager.save(
          Promotion,
          manager.create(Promotion, this.mapPromotionInput(createPromotionDto)),
        );

        await this.replaceRules(
          manager.getRepository(PromotionRule),
          savedPromotion.id,
          createPromotionDto.rules,
        );
        await this.replaceProducts(
          manager.getRepository(PromotionProduct),
          savedPromotion.id,
          createPromotionDto.product_ids,
        );

        return savedPromotion;
      });

      return {
        status: 'ok',
        message: 'Promotion created successfully',
        data: await this.findOneRaw(promotion.id),
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll() {
    const promotions = await this.promotionRepository.find({
      relations: { rules: true, products: { product: true } },
      order: { priority: 'ASC', id: 'ASC' },
    });

    return {
      data: promotions.map((promotion) => this.serializePromotion(promotion)),
    };
  }

  async findOne(id: string) {
    return this.serializePromotion(await this.findOneRaw(id));
  }

  async update(id: string, updatePromotionDto: UpdatePromotionDto) {
    const existingPromotion = await this.promotionRepository.findOne({
      where: { id },
      relations: { rules: true, products: true },
    });

    if (!existingPromotion) {
      throw new NotFoundException('Promotion not found');
    }

    const mergedPayload = {
      ...existingPromotion,
      ...updatePromotionDto,
      rules:
        updatePromotionDto.rules ??
        existingPromotion.rules.map((rule): PromotionRuleDto => ({
          min_qty: rule.min_qty,
          bundle_price: this.optionalNumber(rule.bundle_price),
          unit_price: this.optionalNumber(rule.unit_price),
          discount_percent: this.optionalNumber(rule.discount_percent),
        })),
      product_ids:
        updatePromotionDto.product_ids ??
        existingPromotion.products.map((product) => Number(product.product_id)),
    };

    this.validatePromotionPayload(mergedPayload);

    if (
      updatePromotionDto.promotion_code &&
      updatePromotionDto.promotion_code !== existingPromotion.promotion_code
    ) {
      await this.ensurePromotionCodeAvailable(
        updatePromotionDto.promotion_code,
        id,
      );
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.update(Promotion, id, this.mapPromotionInput(mergedPayload));

        if (updatePromotionDto.rules) {
          const ruleRepository = manager.getRepository(PromotionRule);
          await ruleRepository.delete({ promotion_id: id });
          await this.replaceRules(ruleRepository, id, updatePromotionDto.rules);
        }

        if (updatePromotionDto.product_ids) {
          const productRepository = manager.getRepository(PromotionProduct);
          await productRepository.delete({ promotion_id: id });
          await this.replaceProducts(
            productRepository,
            id,
            updatePromotionDto.product_ids,
          );
        }
      });

      return {
        status: 'ok',
        message: 'Promotion updated successfully',
        data: await this.findOneRaw(id),
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    const promotion = await this.promotionRepository.findOne({ where: { id } });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    await this.promotionRepository.update(id, {
      status: PromotionStatus.INACTIVE,
    });

    return {
      status: 'ok',
      message: 'Promotion deactivated successfully',
      data: { id: Number(id), status: PromotionStatus.INACTIVE },
    };
  }

  async calculate(items: CalculatePromotionItemDto[]) {
    const subtotal = this.roundMoney(
      items.reduce((sum, item) => sum + item.qty * item.unit_price, 0),
    );
    const itemResults = items.map((item) => ({
      product_id: item.product_id,
      qty: item.qty,
      unit_price: item.unit_price,
      discount_amount: 0,
      final_price: this.roundMoney(item.qty * item.unit_price),
    }));

    const promotions = await this.findActivePromotionsForProducts(
      items.map((item) => item.product_id),
    );
    const appliedPromotions: AppliedPromotionResult[] = [];

    for (const promotion of promotions) {
      const productIds = new Set(
        promotion.products.map((product) => Number(product.product_id)),
      );
      const eligibleItems = items.filter((item) => productIds.has(item.product_id));
      const groups = this.buildPromotionGroups(promotion, eligibleItems);

      for (const group of groups) {
        const application = this.calculatePromotionDiscount(promotion, group);

        if (!application || application.discount_amount <= 0) {
          continue;
        }

        this.distributeDiscount(itemResults, group.items, application.discount_amount);
        appliedPromotions.push({
          promotion_id: Number(promotion.id),
          promotion_name: promotion.promotion_name,
          promotion_type: promotion.promotion_type,
          discount_amount: this.roundMoney(application.discount_amount),
          matched_qty: application.matched_qty,
        });

        if (!promotion.can_combine) {
          break;
        }
      }
    }

    const discountTotal = this.roundMoney(
      itemResults.reduce((sum, item) => sum + item.discount_amount, 0),
    );

    return {
      subtotal,
      discount_total: discountTotal,
      grand_total: this.roundMoney(subtotal - discountTotal),
      applied_promotions: appliedPromotions,
      items: itemResults.map((item) => ({
        ...item,
        discount_amount: this.roundMoney(item.discount_amount),
        final_price: this.roundMoney(item.qty * item.unit_price - item.discount_amount),
      })),
    };
  }

  private async findOneRaw(id: string) {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
      relations: { rules: true, products: { product: true } },
      order: { rules: { min_qty: 'ASC' } },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return promotion;
  }

  private async findActivePromotionsForProducts(productIds: number[]) {
    if (productIds.length === 0) {
      return [];
    }

    const now = new Date();

    return this.promotionRepository
      .createQueryBuilder('promotion')
      .leftJoinAndSelect('promotion.rules', 'rule')
      .leftJoinAndSelect('promotion.products', 'promotionProduct')
      .where('promotion.status = :status', { status: PromotionStatus.ACTIVE })
      .andWhere('(promotion.start_date IS NULL OR promotion.start_date <= :now)', {
        now,
      })
      .andWhere('(promotion.end_date IS NULL OR promotion.end_date >= :now)', {
        now,
      })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from(PromotionProduct, 'eligibleProduct')
          .where('eligibleProduct.promotion_id = promotion.id')
          .andWhere('eligibleProduct.product_id IN (:...productIds)')
          .getQuery();

        return `EXISTS ${subQuery}`;
      })
      .setParameter(
        'productIds',
        productIds.map((id) => id.toString()),
      )
      .orderBy('promotion.priority', 'ASC')
      .addOrderBy('promotion.id', 'ASC')
      .addOrderBy('rule.min_qty', 'DESC')
      .getMany();
  }

  private buildPromotionGroups(
    promotion: Promotion,
    items: CalculatePromotionItemDto[],
  ): PromotionGroup[] {
    if (promotion.allow_mix && promotion.mix_type === PromotionMixType.PRODUCT) {
      return [
        {
          items,
          qty: items.reduce((sum, item) => sum + item.qty, 0),
          subtotal: items.reduce(
            (sum, item) => sum + item.qty * item.unit_price,
            0,
          ),
        },
      ];
    }

    return items.map((item) => ({
      items: [item],
      qty: item.qty,
      subtotal: item.qty * item.unit_price,
    }));
  }

  private calculatePromotionDiscount(promotion: Promotion, group: PromotionGroup) {
    const rule = this.pickBestRule(promotion.rules, group.qty);

    if (!rule) {
      return null;
    }

    if (promotion.promotion_type === PromotionType.FIXED_BUNDLE_PRICE) {
      const bundlePrice = Number(rule.bundle_price);
      const bundleCount = Math.floor(group.qty / rule.min_qty);
      const matchedQty = bundleCount * rule.min_qty;
      const matchedSubtotal = this.takeSubtotalForQty(group.items, matchedQty);
      const discountAmount = matchedSubtotal - bundleCount * bundlePrice;

      return {
        discount_amount: Math.max(discountAmount, 0),
        matched_qty: matchedQty,
      };
    }

    if (promotion.promotion_type === PromotionType.TIER_UNIT_PRICE) {
      const unitPrice = Number(rule.unit_price);
      const discountAmount = group.subtotal - group.qty * unitPrice;

      return {
        discount_amount: Math.max(discountAmount, 0),
        matched_qty: group.qty,
      };
    }

    const discountPercent = Number(rule.discount_percent);

    return {
      discount_amount: group.subtotal * (discountPercent / 100),
      matched_qty: group.qty,
    };
  }

  private pickBestRule(rules: PromotionRule[], qty: number) {
    return [...rules]
      .filter((rule) => qty >= rule.min_qty)
      .sort((a, b) => b.min_qty - a.min_qty)[0];
  }

  private takeSubtotalForQty(items: CalculatePromotionItemDto[], qty: number) {
    let remainingQty = qty;
    let subtotal = 0;

    for (const item of items) {
      if (remainingQty <= 0) {
        break;
      }

      const usedQty = Math.min(item.qty, remainingQty);
      subtotal += usedQty * item.unit_price;
      remainingQty -= usedQty;
    }

    return subtotal;
  }

  private distributeDiscount(
    itemResults: CartItemResult[],
    items: CalculatePromotionItemDto[],
    discountAmount: number,
  ) {
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
    let remainingDiscount = this.roundMoney(discountAmount);

    items.forEach((item, index) => {
      const targetItem = itemResults.find(
        (result) => result.product_id === item.product_id,
      );

      if (!targetItem || subtotal <= 0) {
        return;
      }

      const share =
        index === items.length - 1
          ? remainingDiscount
          : this.roundMoney(
              discountAmount * ((item.qty * item.unit_price) / subtotal),
            );

      targetItem.discount_amount = this.roundMoney(
        targetItem.discount_amount + share,
      );
      targetItem.final_price = this.roundMoney(
        targetItem.qty * targetItem.unit_price - targetItem.discount_amount,
      );
      remainingDiscount = this.roundMoney(remainingDiscount - share);
    });
  }

  private validatePromotionPayload(
    promotionDto: PromotionPayload,
  ) {
    const allowMix = promotionDto.allow_mix ?? false;
    const mixType =
      promotionDto.mix_type ??
      (allowMix ? PromotionMixType.PRODUCT : PromotionMixType.NONE);

    if (
      allowMix &&
      mixType !== PromotionMixType.PRODUCT
    ) {
      throw new BadRequestException('mix_type must be PRODUCT when allow_mix is true');
    }

    if (!allowMix && mixType !== PromotionMixType.NONE) {
      throw new BadRequestException('mix_type must be NONE when allow_mix is false');
    }

    for (const rule of promotionDto.rules) {
      this.validateRuleForPromotionType(promotionDto.promotion_type, rule);
    }
  }

  private validateRuleForPromotionType(
    promotionType: PromotionType,
    rule: PromotionRuleDto,
  ) {
    if (promotionType === PromotionType.FIXED_BUNDLE_PRICE && !rule.bundle_price) {
      throw new BadRequestException(
        'bundle_price is required for FIXED_BUNDLE_PRICE',
      );
    }

    if (promotionType === PromotionType.TIER_UNIT_PRICE && !rule.unit_price) {
      throw new BadRequestException('unit_price is required for TIER_UNIT_PRICE');
    }

    if (
      promotionType === PromotionType.PERCENT_DISCOUNT &&
      !rule.discount_percent
    ) {
      throw new BadRequestException(
        'discount_percent is required for PERCENT_DISCOUNT',
      );
    }
  }

  private async ensurePromotionCodeAvailable(code: string, exceptId?: string) {
    const existingPromotion = await this.promotionRepository.findOne({
      where: { promotion_code: code },
    });

    if (existingPromotion && existingPromotion.id !== exceptId) {
      throw new ConflictException('Promotion code already exists');
    }
  }

  private async replaceRules(
    repository: Repository<PromotionRule>,
    promotionId: string,
    rules: PromotionRuleDto[],
  ) {
    await repository.save(
      rules.map((rule) =>
        repository.create({
          promotion_id: promotionId,
          min_qty: rule.min_qty,
          bundle_price: this.numberToString(rule.bundle_price),
          unit_price: this.numberToString(rule.unit_price),
          discount_percent: this.numberToString(rule.discount_percent),
        }),
      ),
    );
  }

  private async replaceProducts(
    repository: Repository<PromotionProduct>,
    promotionId: string,
    productIds: number[],
  ) {
    const uniqueProductIds = [...new Set(productIds)];
    await repository.save(
      uniqueProductIds.map((productId) =>
        repository.create({
          promotion_id: promotionId,
          product_id: productId.toString(),
        }),
      ),
    );
  }

  private mapPromotionInput(
    promotionDto: Partial<PromotionPayload>,
  ) {
    const allowMix = promotionDto.allow_mix ?? false;
    const mixType =
      promotionDto.mix_type ??
      (allowMix ? PromotionMixType.PRODUCT : PromotionMixType.NONE);

    return {
      promotion_code: promotionDto.promotion_code,
      promotion_name: promotionDto.promotion_name,
      promotion_type: promotionDto.promotion_type,
      allow_mix: allowMix,
      mix_type: mixType,
      start_date: promotionDto.start_date
        ? new Date(promotionDto.start_date)
        : promotionDto.start_date,
      end_date: promotionDto.end_date
        ? new Date(promotionDto.end_date)
        : promotionDto.end_date,
      priority: promotionDto.priority,
      can_combine: promotionDto.can_combine,
      status: promotionDto.status,
    };
  }

  private serializePromotion(promotion: Promotion) {
    return {
      ...promotion,
      id: Number(promotion.id),
      rules: promotion.rules
        .sort((a, b) => a.min_qty - b.min_qty)
        .map((rule) => ({
          id: Number(rule.id),
          min_qty: rule.min_qty,
          bundle_price: this.nullableNumber(rule.bundle_price),
          unit_price: this.nullableNumber(rule.unit_price),
          discount_percent: this.nullableNumber(rule.discount_percent),
        })),
      products: promotion.products.map((promotionProduct) => ({
        id: Number(promotionProduct.id),
        product_id: Number(promotionProduct.product_id),
        product: promotionProduct.product
          ? {
              id: Number(promotionProduct.product.id),
              barcode: promotionProduct.product.barcode,
              product_name: promotionProduct.product.product_name,
              sale_price: Number(promotionProduct.product.sale_price),
            }
          : undefined,
      })),
    };
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string };

      if (driverError.code === '23505') {
        throw new ConflictException('Promotion code already exists');
      }

      if (driverError.code === '23503') {
        throw new BadRequestException('One or more product_ids do not exist');
      }
    }

    throw error;
  }

  private nullableNumber(value?: string | number | null) {
    return value === undefined || value === null ? null : Number(value);
  }

  private optionalNumber(value?: string | number | null) {
    return value === undefined || value === null ? undefined : Number(value);
  }

  private numberToString(value?: number | null) {
    return value === undefined || value === null ? null : value.toString();
  }

  private roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
