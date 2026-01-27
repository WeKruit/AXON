import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Patch,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { AccountService } from '@gitroom/nestjs-libraries/database/firestore/collections/accounts/account.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  AccountListQueryDto,
  AccountResponseDto,
  BulkImportAccountDto,
  BulkImportResultDto,
  UpdateAccountStatusDto,
  AssignAccountProxyDto,
  LinkAccountIntegrationDto,
  Platform,
  AccountStatus,
} from '@gitroom/nestjs-libraries/dtos/axon';

@ApiTags('AXON - Accounts')
@Controller('/axon/accounts')
export class AccountsController {
  constructor(private readonly accountService: AccountService) {}

  @Post('/')
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully', type: AccountResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Soul or proxy not found' })
  @ApiResponse({ status: 409, description: 'Account with handle already exists on platform' })
  async create(
    @GetOrgFromRequest() organization: Organization,
    @Body() dto: CreateAccountDto
  ): Promise<AccountResponseDto> {
    return this.accountService.create(organization.id, dto);
  }

  @Post('/bulk-import')
  @ApiOperation({ summary: 'Bulk import accounts from CSV' })
  @ApiResponse({ status: 201, description: 'Bulk import results', type: BulkImportResultDto })
  @ApiResponse({ status: 400, description: 'Invalid CSV format' })
  @ApiResponse({ status: 404, description: 'Soul not found' })
  async bulkImport(
    @GetOrgFromRequest() organization: Organization,
    @Body() dto: BulkImportAccountDto
  ): Promise<BulkImportResultDto> {
    return this.accountService.bulkImport(organization.id, dto);
  }

  @Get('/')
  @ApiOperation({ summary: 'List all accounts' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  @ApiQuery({ name: 'platform', enum: Platform, required: false })
  @ApiQuery({ name: 'status', enum: AccountStatus, required: false })
  @ApiQuery({ name: 'soulId', required: false })
  @ApiQuery({ name: 'proxyId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  async findAll(
    @GetOrgFromRequest() organization: Organization,
    @Query() query: AccountListQueryDto
  ): Promise<{ data: AccountResponseDto[]; hasMore: boolean }> {
    return this.accountService.findAll(organization.id, query);
  }

  @Get('/count')
  @ApiOperation({ summary: 'Get total account count' })
  @ApiResponse({ status: 200, description: 'Total count of accounts' })
  async getCount(
    @GetOrgFromRequest() organization: Organization
  ): Promise<{
    count: number;
    byStatus: Record<string, number>;
    byPlatform: Record<string, number>;
  }> {
    // Use optimized parallel query method to avoid N+1 problem
    const counts = await this.accountService.getAllCounts(organization.id);
    return {
      count: counts.total,
      byStatus: counts.byStatus,
      byPlatform: counts.byPlatform,
    };
  }

  @Get('/soul/:soulId')
  @ApiOperation({ summary: 'Get accounts by soul ID' })
  @ApiParam({ name: 'soulId', description: 'Soul ID' })
  @ApiResponse({ status: 200, description: 'Accounts for the soul' })
  async findBySoulId(
    @GetOrgFromRequest() organization: Organization,
    @Param('soulId') soulId: string
  ): Promise<AccountResponseDto[]> {
    return this.accountService.findBySoulId(organization.id, soulId);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get an account by ID' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account details', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findById(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string
  ): Promise<AccountResponseDto> {
    return this.accountService.findById(organization.id, id);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update an account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account updated successfully', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'Account or proxy not found' })
  @ApiResponse({ status: 409, description: 'Account with handle already exists on platform' })
  async update(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto
  ): Promise<AccountResponseDto> {
    return this.accountService.update(organization.id, id, dto);
  }

  @Put('/:id/status')
  @ApiOperation({ summary: 'Update account status' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account status updated', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updateStatus(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string,
    @Body() dto: UpdateAccountStatusDto
  ): Promise<AccountResponseDto> {
    return this.accountService.updateStatus(organization.id, id, dto.status);
  }

  @Put('/:id/proxy')
  @ApiOperation({ summary: 'Assign or unassign proxy to account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Proxy assignment updated', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'Account or proxy not found' })
  async assignProxy(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string,
    @Body() dto: AssignAccountProxyDto
  ): Promise<AccountResponseDto> {
    return this.accountService.assignProxy(organization.id, id, dto.proxyId ?? null);
  }

  @Patch('/:id/integration')
  @ApiOperation({ summary: 'Link or unlink account to/from a Postiz integration' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Integration link updated', type: AccountResponseDto })
  @ApiResponse({ status: 400, description: 'Platform mismatch or account not linked' })
  @ApiResponse({ status: 404, description: 'Account or integration not found' })
  @ApiResponse({ status: 409, description: 'Integration already linked to another account' })
  async linkIntegration(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string,
    @Body() dto: LinkAccountIntegrationDto
  ): Promise<AccountResponseDto> {
    if (dto.integrationId === null || dto.integrationId === undefined) {
      // Unlink the integration
      return this.accountService.unlinkFromIntegration(organization.id, id);
    }
    // Link to the integration
    return this.accountService.linkToIntegration(organization.id, id, dto.integrationId);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async delete(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string
  ): Promise<void> {
    await this.accountService.delete(organization.id, id);
  }
}
