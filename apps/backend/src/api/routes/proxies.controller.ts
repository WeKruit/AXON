import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { ProxyService } from '@gitroom/nestjs-libraries/database/firestore/collections/proxies/proxy.service';
import { IPRoyalClient } from '@gitroom/nestjs-libraries/proxy-providers';
import {
  CreateProxyDto,
  UpdateProxyDto,
  ProxyListQueryDto,
  ProxyResponseDto,
  ProxyHealthCheckDto,
  AssignProxyDto,
  UpdateProxyStatusDto,
  ProxyType,
  ProxyPurpose,
  ProxyStatus,
  ProxyProvider,
  PROXY_PURPOSE_MATRIX,
} from '@gitroom/nestjs-libraries/dtos/axon';

@ApiTags('AXON - Proxies')
@Controller('/axon/proxies')
export class ProxiesController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly ipRoyalClient: IPRoyalClient
  ) {}

  @Post('/')
  @ApiOperation({ summary: 'Create a new proxy' })
  @ApiResponse({ status: 201, description: 'Proxy created successfully', type: ProxyResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or proxy type not suitable for purpose' })
  @ApiResponse({ status: 409, description: 'Proxy with external ID already exists' })
  async create(
    @GetOrgFromRequest() organization: Organization,
    @Body() dto: CreateProxyDto
  ): Promise<ProxyResponseDto> {
    return this.proxyService.create(organization.id, dto);
  }

  @Get('/')
  @ApiOperation({ summary: 'List all proxies' })
  @ApiResponse({ status: 200, description: 'List of proxies' })
  @ApiQuery({ name: 'provider', enum: ProxyProvider, required: false })
  @ApiQuery({ name: 'type', enum: ProxyType, required: false })
  @ApiQuery({ name: 'purpose', enum: ProxyPurpose, required: false })
  @ApiQuery({ name: 'status', enum: ProxyStatus, required: false })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  async findAll(
    @GetOrgFromRequest() organization: Organization,
    @Query() query: ProxyListQueryDto
  ): Promise<{ data: ProxyResponseDto[]; hasMore: boolean }> {
    return this.proxyService.findAll(organization.id, query);
  }

  @Get('/count')
  @ApiOperation({ summary: 'Get total proxy count' })
  @ApiResponse({ status: 200, description: 'Total count of proxies' })
  async getCount(
    @GetOrgFromRequest() organization: Organization
  ): Promise<{ count: number; byStatus: Record<string, number> }> {
    // Use optimized parallel query method to avoid N+1 problem
    const counts = await this.proxyService.getAllCounts(organization.id);
    return {
      count: counts.total,
      byStatus: counts.byStatus,
    };
  }

  @Get('/purpose-matrix')
  @ApiOperation({ summary: 'Get proxy type recommendations for each purpose' })
  @ApiResponse({ status: 200, description: 'Proxy-purpose matrix' })
  getPurposeMatrix(): Record<ProxyPurpose, ProxyType[]> {
    return PROXY_PURPOSE_MATRIX;
  }

  @Get('/available/:purpose')
  @ApiOperation({ summary: 'Get available proxies for a specific purpose' })
  @ApiParam({ name: 'purpose', enum: ProxyPurpose })
  @ApiResponse({ status: 200, description: 'Available proxies for the purpose' })
  async findAvailableForPurpose(
    @GetOrgFromRequest() organization: Organization,
    @Param('purpose') purpose: ProxyPurpose
  ): Promise<ProxyResponseDto[]> {
    return this.proxyService.findAvailableForPurpose(organization.id, purpose);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get a proxy by ID' })
  @ApiParam({ name: 'id', description: 'Proxy ID' })
  @ApiResponse({ status: 200, description: 'Proxy details', type: ProxyResponseDto })
  @ApiResponse({ status: 404, description: 'Proxy not found' })
  async findById(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string
  ): Promise<ProxyResponseDto> {
    return this.proxyService.findById(organization.id, id);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update a proxy' })
  @ApiParam({ name: 'id', description: 'Proxy ID' })
  @ApiResponse({ status: 200, description: 'Proxy updated successfully', type: ProxyResponseDto })
  @ApiResponse({ status: 404, description: 'Proxy not found' })
  @ApiResponse({ status: 400, description: 'Proxy type not suitable for purpose' })
  async update(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string,
    @Body() dto: UpdateProxyDto
  ): Promise<ProxyResponseDto> {
    return this.proxyService.update(organization.id, id, dto);
  }

  @Put('/:id/status')
  @ApiOperation({ summary: 'Update proxy status' })
  @ApiParam({ name: 'id', description: 'Proxy ID' })
  @ApiResponse({ status: 200, description: 'Proxy status updated', type: ProxyResponseDto })
  @ApiResponse({ status: 404, description: 'Proxy not found' })
  async updateStatus(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string,
    @Body() dto: UpdateProxyStatusDto
  ): Promise<ProxyResponseDto> {
    return this.proxyService.updateStatus(organization.id, id, dto.status);
  }

  @Post('/:id/assign')
  @ApiOperation({ summary: 'Assign an account to a proxy' })
  @ApiParam({ name: 'id', description: 'Proxy ID' })
  @ApiResponse({ status: 200, description: 'Account assigned to proxy' })
  @ApiResponse({ status: 404, description: 'Proxy not found' })
  @ApiResponse({ status: 400, description: 'Cannot assign to inactive proxy' })
  async assignAccount(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string,
    @Body() dto: AssignProxyDto
  ): Promise<void> {
    await this.proxyService.assignAccount(organization.id, id, dto.accountId);
  }

  @Delete('/:id/assign/:accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unassign an account from a proxy' })
  @ApiParam({ name: 'id', description: 'Proxy ID' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ status: 204, description: 'Account unassigned from proxy' })
  async unassignAccount(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string,
    @Param('accountId') accountId: string
  ): Promise<void> {
    await this.proxyService.unassignAccount(organization.id, id, accountId);
  }

  @Get('/:id/health')
  @ApiOperation({ summary: 'Check proxy health' })
  @ApiParam({ name: 'id', description: 'Proxy ID' })
  @ApiResponse({ status: 200, description: 'Proxy health status', type: ProxyHealthCheckDto })
  @ApiResponse({ status: 404, description: 'Proxy not found' })
  async healthCheck(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string
  ): Promise<ProxyHealthCheckDto> {
    return this.proxyService.healthCheck(organization.id, id);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a proxy' })
  @ApiParam({ name: 'id', description: 'Proxy ID' })
  @ApiResponse({ status: 204, description: 'Proxy deleted successfully' })
  @ApiResponse({ status: 404, description: 'Proxy not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete proxy with assigned accounts' })
  async delete(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string
  ): Promise<void> {
    await this.proxyService.delete(organization.id, id);
  }

  // IPRoyal-specific endpoints
  @Get('/iproyal/account')
  @ApiOperation({ summary: 'Get IPRoyal account information' })
  @ApiResponse({ status: 200, description: 'IPRoyal account info' })
  async getIPRoyalAccount() {
    return this.ipRoyalClient.getAccountInfo();
  }

  @Get('/iproyal/list')
  @ApiOperation({ summary: 'List proxies from IPRoyal' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'IPRoyal proxies list' })
  async listIPRoyalProxies(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ) {
    return this.ipRoyalClient.listProxies(page || 1, pageSize || 50);
  }

  @Post('/iproyal/:proxyId/rotate')
  @ApiOperation({ summary: 'Rotate an IPRoyal proxy IP' })
  @ApiParam({ name: 'proxyId', description: 'IPRoyal Proxy ID' })
  @ApiResponse({ status: 200, description: 'Proxy rotated successfully' })
  async rotateIPRoyalProxy(@Param('proxyId') proxyId: string) {
    return this.ipRoyalClient.rotateProxy(proxyId);
  }
}
