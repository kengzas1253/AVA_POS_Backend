import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

type TableColumn = {
  column_name: string;
  column_default: string | null;
  is_nullable: 'YES' | 'NO';
};

@Injectable()
export class PaymentAccountsService {
  private readonly tableName = 'payment_accounts';
  private readonly blockedWriteColumns = new Set([
    'id',
    'created_at',
    'updated_at',
  ]);

  constructor(private readonly dataSource: DataSource) {}

  findAll() {
    return this.dataSource.query(
      `SELECT * FROM ${this.quoteIdentifier(this.tableName)} ORDER BY ${this.quoteIdentifier('id')} ASC`,
    );
  }

  async create(body: Record<string, unknown>) {
    const columns = await this.getWritableColumns();
    const input = this.pickWritableInput(body, columns);

    if (Object.keys(input).length === 0) {
      throw new BadRequestException('Payment account data is required');
    }

    const columnNames = Object.keys(input);
    const quotedColumns = columnNames
      .map((columnName) => this.quoteIdentifier(columnName))
      .join(', ');
    const valuePlaceholders = columnNames
      .map((_, index) => `$${index + 1}`)
      .join(', ');
    const values = columnNames.map((columnName) => input[columnName]);

    const [paymentAccount] = await this.dataSource.query(
      `INSERT INTO ${this.quoteIdentifier(this.tableName)} (${quotedColumns}) VALUES (${valuePlaceholders}) RETURNING *`,
      values,
    );

    return {
      status: 'ok',
      message: 'Payment account created successfully',
      data: paymentAccount,
    };
  }

  async update(id: string, body: Record<string, unknown>) {
    const columns = await this.getWritableColumns();
    const input = this.pickWritableInput(body, columns);

    if (Object.keys(input).length === 0) {
      throw new BadRequestException('Payment account data is required');
    }

    const columnNames = Object.keys(input);
    const setClause = columnNames
      .map(
        (columnName, index) =>
          `${this.quoteIdentifier(columnName)} = $${index + 1}`,
      )
      .join(', ');
    const values = columnNames.map((columnName) => input[columnName]);

    const [paymentAccount] = await this.dataSource.query(
      `UPDATE ${this.quoteIdentifier(this.tableName)} SET ${setClause} WHERE ${this.quoteIdentifier('id')} = $${values.length + 1} RETURNING *`,
      [...values, id],
    );

    if (!paymentAccount) {
      throw new NotFoundException('Payment account not found');
    }

    return {
      status: 'ok',
      message: 'Payment account updated successfully',
      data: paymentAccount,
    };
  }

  async remove(id: string) {
    const [paymentAccount] = await this.dataSource.query(
      `DELETE FROM ${this.quoteIdentifier(this.tableName)} WHERE ${this.quoteIdentifier('id')} = $1 RETURNING ${this.quoteIdentifier('id')}`,
      [id],
    );

    if (!paymentAccount) {
      throw new NotFoundException('Payment account not found');
    }

    return {
      status: 'ok',
      message: 'Payment account deleted successfully',
      data: {
        id: paymentAccount.id,
      },
    };
  }

  private async getWritableColumns() {
    const columns = await this.dataSource.query<TableColumn[]>(
      `
        SELECT column_name, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
      `,
      [this.tableName],
    );

    if (columns.length === 0) {
      throw new NotFoundException('payment_accounts table not found');
    }

    return new Set(
      columns
        .map((column) => column.column_name)
        .filter((columnName) => !this.blockedWriteColumns.has(columnName)),
    );
  }

  private pickWritableInput(
    body: Record<string, unknown>,
    writableColumns: Set<string>,
  ) {
    return Object.fromEntries(
      Object.entries(body).filter(([columnName]) =>
        writableColumns.has(columnName),
      ),
    );
  }

  private quoteIdentifier(identifier: string) {
    return `"${identifier.replace(/"/g, '""')}"`;
  }
}
