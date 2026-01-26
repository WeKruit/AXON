import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { MatrixService } from '@gitroom/nestjs-libraries/database/prisma/matrix/matrix.service';
import {
  CreateMappingDto,
  UpdateMappingDto,
  ToggleMappingDto,
  BulkMappingDto,
  MatrixFiltersDto,
  MappingResponseDto,
  SoulWithIntegrationsDto,
  IntegrationWithSoulsDto,
  MatrixResponseDto,
  BulkOperationResultDto,
} from '@gitroom/nestjs-libraries/dtos/axon';

@ApiTags('AXON - Soul-Channel Matrix')
@Controller('/axon/matrix')
export class MatrixController {
  constructor(private readonly matrixService: MatrixService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get the full Soul-Channel matrix' })
  @ApiResponse({
    status: 200,
    description: 'Matrix data with pagination',
    type: MatrixResponseDto,
  })
  @ApiQuery({ name: 'soulId', required: false, description: 'Filter by Soul ID' })
  @ApiQuery({ name: 'integrationId', required: false, description: 'Filter by Integration ID' })
  @ApiQuery({ name: 'isPrimary', required: false, type: Boolean, description: 'Filter by primary status' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (default: 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (default: 0)' })
  async getMatrix(
    @GetOrgFromRequest() organization: Organization,
    @Query() filters: MatrixFiltersDto
  ): Promise<MatrixResponseDto> {
    return this.matrixService.getMatrix(organization.id, filters);
  }

  @Get('/souls/:soulId/integrations')
  @ApiOperation({ summary: 'Get all integrations mapped to a specific Soul' })
  @ApiParam({ name: 'soulId', description: 'Soul ID (from Firestore)' })
  @ApiResponse({
    status: 200,
    description: 'List of integrations for the soul',
    type: SoulWithIntegrationsDto,
  })
  @ApiResponse({ status: 404, description: 'Soul not found' })
  async getIntegrationsForSoul(
    @GetOrgFromRequest() organization: Organization,
    @Param('soulId') soulId: string
  ): Promise<SoulWithIntegrationsDto> {
    return this.matrixService.getIntegrationsForSoul(organization.id, soulId);
  }

  @Get('/integrations/:integrationId/souls')
  @ApiOperation({ summary: 'Get all Souls mapped to a specific Integration' })
  @ApiParam({ name: 'integrationId', description: 'Integration ID (from PostgreSQL)' })
  @ApiResponse({
    status: 200,
    description: 'List of souls for the integration',
    type: IntegrationWithSoulsDto,
  })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async getSoulsForIntegration(
    @GetOrgFromRequest() organization: Organization,
    @Param('integrationId') integrationId: string
  ): Promise<IntegrationWithSoulsDto> {
    return this.matrixService.getSoulsForIntegration(
      organization.id,
      integrationId
    );
  }

  @Post('/mappings')
  @ApiOperation({ summary: 'Create a new Soul-Integration mapping' })
  @ApiResponse({
    status: 201,
    description: 'Mapping created successfully',
    type: MappingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Soul or Integration not found' })
  @ApiResponse({ status: 409, description: 'Mapping already exists' })
  async createMapping(
    @GetOrgFromRequest() organization: Organization,
    @GetUserFromRequest() user: User,
    @Body() dto: CreateMappingDto
  ): Promise<MappingResponseDto> {
    return this.matrixService.createMapping(organization.id, dto, user?.id);
  }

  @Post('/mappings/toggle')
  @ApiOperation({
    summary: 'Toggle a mapping (create if not exists, delete if exists)',
  })
  @ApiResponse({
    status: 200,
    description: 'Mapping toggled successfully',
  })
  @ApiResponse({ status: 404, description: 'Soul or Integration not found' })
  async toggleMapping(
    @GetOrgFromRequest() organization: Organization,
    @GetUserFromRequest() user: User,
    @Body() dto: ToggleMappingDto
  ): Promise<{ action: 'created' | 'deleted'; mapping?: MappingResponseDto }> {
    return this.matrixService.toggleMapping(organization.id, dto, user?.id);
  }

  @Post('/mappings/bulk')
  @ApiOperation({ summary: 'Bulk create or delete mappings' })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation completed',
    type: BulkOperationResultDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async bulkOperations(
    @GetOrgFromRequest() organization: Organization,
    @GetUserFromRequest() user: User,
    @Body() dto: BulkMappingDto
  ): Promise<BulkOperationResultDto> {
    return this.matrixService.bulkOperations(organization.id, dto, user?.id);
  }

  @Get('/mappings/:id')
  @ApiOperation({ summary: 'Get a mapping by ID' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  @ApiResponse({
    status: 200,
    description: 'Mapping details',
    type: MappingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Mapping not found' })
  async getMappingById(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string
  ): Promise<MappingResponseDto> {
    return this.matrixService.getMappingById(organization.id, id);
  }

  @Patch('/mappings/:id')
  @ApiOperation({ summary: 'Update an existing mapping' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  @ApiResponse({
    status: 200,
    description: 'Mapping updated successfully',
    type: MappingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Mapping not found' })
  async updateMapping(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string,
    @Body() dto: UpdateMappingDto
  ): Promise<MappingResponseDto> {
    return this.matrixService.updateMapping(organization.id, id, dto);
  }

  @Delete('/mappings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a mapping' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  @ApiResponse({ status: 204, description: 'Mapping deleted successfully' })
  @ApiResponse({ status: 404, description: 'Mapping not found' })
  async deleteMapping(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string
  ): Promise<void> {
    await this.matrixService.deleteMapping(organization.id, id);
  }

  @Post('/mappings/:id/primary')
  @ApiOperation({ summary: 'Set a mapping as the primary channel for its Soul' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  @ApiResponse({
    status: 200,
    description: 'Mapping set as primary successfully',
    type: MappingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Mapping not found' })
  async setPrimaryChannel(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string
  ): Promise<MappingResponseDto> {
    return this.matrixService.setPrimaryChannel(organization.id, id);
  }
}
