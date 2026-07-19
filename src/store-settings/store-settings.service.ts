import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateStoreSettingDto } from './dto/create-store-setting.dto';
import { UpdateStoreSettingDto } from './dto/update-store-setting.dto';
import { StoreSetting } from './entities/store-setting.entity';

type StoreSettingsRow = StoreSetting & {
  payment_account: Record<string, unknown> | null;
};

@Injectable()
export class StoreSettingsService {
  constructor(
    @InjectRepository(StoreSetting)
    private readonly storeSettingRepository: Repository<StoreSetting>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createStoreSettingDto: CreateStoreSettingDto) {
    const storeSetting = this.storeSettingRepository.create(
      this.toEntityInput(createStoreSettingDto),
    );

    const savedStoreSetting = await this.storeSettingRepository.save(
      storeSetting,
    );

    return {
      status: 'ok',
      message: 'Store setting created successfully',
      data: savedStoreSetting,
    };
  }

  findAll() {
    return this.storeSettingRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: string) {
    const storeSetting = await this.storeSettingRepository.findOne({
      where: { id },
    });

    if (!storeSetting) {
      throw new NotFoundException('Store setting not found');
    }

    return storeSetting;
  }

  async findSettings() {
    const [row] = await this.dataSource.query<StoreSettingsRow[]>(`
      SELECT
        s.*,
        row_to_json(pa) AS payment_account
      FROM store_settings s
      LEFT JOIN LATERAL (
        SELECT *
        FROM payment_accounts
        WHERE is_default = true
        ORDER BY id ASC
        LIMIT 1
      ) pa ON true
      ORDER BY s.id ASC
      LIMIT 1
    `);

    if (!row) {
      throw new NotFoundException('Store setting not found');
    }

    return {
      status: 'success',
      message: 'Store settings loaded successfully',
      data: {
        store: this.toStoreResponse(row),
        payment_account: this.toPaymentAccountResponse(row.payment_account),
      },
    };
  }

  async update(id: string, updateStoreSettingDto: UpdateStoreSettingDto) {
    const storeSetting = await this.storeSettingRepository.preload({
      id,
      ...this.toEntityInput(updateStoreSettingDto),
    });

    if (!storeSetting) {
      throw new NotFoundException('Store setting not found');
    }

    await this.storeSettingRepository.save(storeSetting);

    return {
      status: 'ok',
      message: 'Store setting updated successfully',
      data: await this.findOne(id),
    };
  }

  async remove(id: string) {
    const storeSetting = await this.storeSettingRepository.findOne({
      where: { id },
    });

    if (!storeSetting) {
      throw new NotFoundException('Store setting not found');
    }

    await this.storeSettingRepository.remove(storeSetting);

    return {
      status: 'ok',
      message: 'Store setting deleted successfully',
      data: {
        id,
      },
    };
  }

  private toEntityInput(
    dto: CreateStoreSettingDto | UpdateStoreSettingDto,
  ): Partial<StoreSetting> {
    const { vat_rate, default_payment_account_id, ...restDto } = dto;
    const entityInput: Partial<StoreSetting> = { ...restDto };

    if (vat_rate !== undefined) {
      entityInput.vat_rate = vat_rate.toString();
    }

    if (default_payment_account_id !== undefined) {
      entityInput.default_payment_account_id = default_payment_account_id
        ? default_payment_account_id.toString()
        : null;
    }

    return entityInput;
  }

  private toStoreResponse(storeSetting: StoreSetting) {
    return {
      id: Number(storeSetting.id),
      store_name: storeSetting.store_name,
      owner_name: storeSetting.owner_name,
      tax_id: storeSetting.tax_id,
      branch_name: storeSetting.branch_name,
      branch_no: storeSetting.branch_no,
      address: storeSetting.address,
      phone: storeSetting.phone,
      email: storeSetting.email,
      website: storeSetting.website,
      logo_url: storeSetting.logo_url,
      receipt_image_url: storeSetting.receipt_image_url,
      receipt_header: storeSetting.receipt_header,
      receipt_footer: storeSetting.receipt_footer,
      receipt_paper_size: storeSetting.receipt_paper_size,
      show_logo: storeSetting.show_logo,
      show_receipt_image: storeSetting.show_receipt_image,
      show_promptpay_qr: storeSetting.show_promptpay_qr,
      auto_print_receipt: storeSetting.auto_print_receipt,
      vat_enabled: storeSetting.vat_enabled,
      vat_rate: Number(storeSetting.vat_rate),
      language: storeSetting.language,
      currency: storeSetting.currency,
      timezone: storeSetting.timezone,
      allow_negative_stock: storeSetting.allow_negative_stock,
      default_customer_name: storeSetting.default_customer_name,
    };
  }

  private toPaymentAccountResponse(
    paymentAccount: Record<string, unknown> | null,
  ) {
    if (!paymentAccount) {
      return null;
    }

    return {
      id: Number(paymentAccount.id),
      account_name: paymentAccount.account_name,
      bank_name: paymentAccount.bank_name,
      account_no: paymentAccount.account_no,
      account_holder: paymentAccount.account_holder,
      promptpay_type: paymentAccount.promptpay_type,
      promptpay_id: paymentAccount.promptpay_id,
      is_default: paymentAccount.is_default,
    };
  }
}
