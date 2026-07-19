import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreatePosMachineSettingDto } from './dto/create-pos-machine-setting.dto';
import { UpdatePosMachineSettingDto } from './dto/update-pos-machine-setting.dto';
import { PosMachineSetting } from './entities/pos-machine-setting.entity';

@Injectable()
export class PosMachineSettingsService {
  constructor(
    @InjectRepository(PosMachineSetting)
    private readonly repository: Repository<PosMachineSetting>,
  ) {}

  async create(dto: CreatePosMachineSettingDto) {
    const settings = this.repository.create(this.toEntityInput(dto));

    try {
      return await this.repository.save(settings);
    } catch (error) {
      this.handleDatabaseError(error, dto.machine_id);
    }
  }

  findAll() {
    return this.repository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async findByMachineId(machineId: string) {
    const settings = await this.repository.findOne({
      where: {
        machineId,
      },
    });

    if (!settings) {
      throw new NotFoundException(
        `Machine settings not found for machine_id: ${machineId}`,
      );
    }

    return settings;
  }

  async updateByMachineId(
    machineId: string,
    dto: UpdatePosMachineSettingDto,
  ) {
    const settings = await this.findByMachineId(machineId);

    this.repository.merge(settings, this.toEntityInput(dto));

    try {
      return await this.repository.save(settings);
    } catch (error) {
      this.handleDatabaseError(error, machineId);
    }
  }

  async removeByMachineId(machineId: string) {
    const settings = await this.findByMachineId(machineId);

    await this.repository.remove(settings);

    return {
      machine_id: machineId,
    };
  }

  private toEntityInput(
    dto: CreatePosMachineSettingDto | UpdatePosMachineSettingDto,
  ): Partial<PosMachineSetting> {
    const entityInput: Partial<PosMachineSetting> = {};

    if ('machine_id' in dto && dto.machine_id !== undefined) {
      entityInput.machineId = dto.machine_id;
    }
    if (dto.receipt_printer_name !== undefined) {
      entityInput.receiptPrinterName = dto.receipt_printer_name;
    }
    if (dto.receipt_paper_size !== undefined) {
      entityInput.receiptPaperSize = dto.receipt_paper_size;
    }
    if (dto.receipt_font_size !== undefined) {
      entityInput.receiptFontSize = dto.receipt_font_size;
    }
    if (dto.receipt_font_family !== undefined) {
      entityInput.receiptFontFamily = dto.receipt_font_family;
    }
    if (dto.receipt_copies !== undefined) {
      entityInput.receiptCopies = dto.receipt_copies;
    }
    if (dto.auto_print_receipt !== undefined) {
      entityInput.autoPrintReceipt = dto.auto_print_receipt;
    }
    if (dto.auto_open_cash_drawer !== undefined) {
      entityInput.autoOpenCashDrawer = dto.auto_open_cash_drawer;
    }
    if (dto.a4_printer_name !== undefined) {
      entityInput.a4PrinterName = dto.a4_printer_name;
    }
    if (dto.a4_copies !== undefined) entityInput.a4Copies = dto.a4_copies;
    if (dto.label_printer_name !== undefined) {
      entityInput.labelPrinterName = dto.label_printer_name;
    }
    if (dto.label_width_mm !== undefined) {
      entityInput.labelWidthMm = dto.label_width_mm;
    }
    if (dto.label_height_mm !== undefined) {
      entityInput.labelHeightMm = dto.label_height_mm;
    }
    if (dto.customer_display_enabled !== undefined) {
      entityInput.customerDisplayEnabled = dto.customer_display_enabled;
    }
    if (dto.customer_display_monitor !== undefined) {
      entityInput.customerDisplayMonitor = dto.customer_display_monitor;
    }
    if (dto.barcode_scanner_enabled !== undefined) {
      entityInput.barcodeScannerEnabled = dto.barcode_scanner_enabled;
    }
    if (dto.allow_below_cost !== undefined) {
      entityInput.allowBelowCost = dto.allow_below_cost;
    }
    if (dto.min_profit_amount !== undefined) {
      entityInput.minProfitAmount = dto.min_profit_amount.toString();
    }
    if (dto.require_manager_approval !== undefined) {
      entityInput.requireManagerApproval = dto.require_manager_approval;
    }
    if (dto.manager_pin_required !== undefined) {
      entityInput.managerPinRequired = dto.manager_pin_required;
    }
    if (dto.language !== undefined) entityInput.language = dto.language;
    if (dto.theme !== undefined) entityInput.theme = dto.theme;

    return entityInput;
  }

  private handleDatabaseError(error: unknown, machineId: string): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string };

      if (driverError.code === '23505') {
        throw new ConflictException(
          `Machine settings already exist for machine_id: ${machineId}`,
        );
      }
    }

    throw error;
  }
}
