import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MatrixService } from '@gitroom/nestjs-libraries/database/prisma/matrix/matrix.service';
import {
  CreateMappingDto,
  UpdateMappingDto,
  BulkMappingRequestDto,
  MatrixQueryDto,
  MatrixResponseDto,
  MappingDto,
  BulkMappingResponseDto,
  ToggleMappingResponseDto,
  SoulIntegrationDto,
  IntegrationSoulDto,
} from '@gitroom/nestjs-libraries/dtos/matrix/matrix.dto';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';

@ApiTags('AXON - Matrix')
@Controller('/axon/matrix')
export class MatrixController {
  constructor(private readonly matrixService: MatrixService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get the Soul-Channel Matrix' })
  @ApiResponse({
    status: 200,
    description: 'Matrix data with souls, integrations, and mappings',
    type: MatrixResponseDto,
  })
  async getMatrix(
    @GetOrgFromRequest() org: Organization,
    @Query() query: MatrixQueryDto
  ): Promise<MatrixResponseDto> {
    return this.matrixService.getMatrix(org.id, query);
  }

  @Get('/souls/:soulId/integrations')
  @ApiOperation({ summary: 'Get integrations mapped to a soul' })
  @ApiParam({ name: 'soulId', description: 'Soul ID' })
  @ApiResponse({
    status: 200,
    description: 'List of integrations for the soul',
    type: [SoulIntegrationDto],
  })
  @ApiResponse({ status: 404, description: 'Soul not found' })
  async getIntegrationsForSoul(
    @GetOrgFromRequest() org: Organization,
    @Param('soulId') soulId: string
  ): Promise<SoulIntegrationDto[]> {
    return this.matrixService.getIntegrationsForSoul(soulId, org.id);
  }

  @Get('/integrations/:integrationId/souls')
  @ApiOperation({ summary: 'Get souls mapped to an integration' })
  @ApiParam({ name: 'integrationId', description: 'Integration ID' })
  @ApiResponse({
    status: 200,
    description: 'List of souls for the integration',
    type: [IntegrationSoulDto],
  })
  async getSoulsForIntegration(
    @GetOrgFromRequest() org: Organization,
    @Param('integrationId') integrationId: string
  ): Promise<IntegrationSoulDto[]> {
    return this.matrixService.getSoulsForIntegration(integrationId, org.id);
  }

  @Post('/mappings')
  @ApiOperation({ summary: 'Create a new mapping' })
  @ApiResponse({
    status: 201,
    description: 'Mapping created successfully',
    type: MappingDto,
  })
  @ApiResponse({ status: 400, description: 'Mapping already exists' })
  @ApiResponse({ status: 404, description: 'Soul not found' })
  async createMapping(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() data: CreateMappingDto
  ): Promise<MappingDto> {
    return this.matrixService.createMapping(data, org.id, user.id);
  }

  @Post('/mappings/toggle')
  @ApiOperation({ summary: 'Toggle a mapping (create if not exists, delete if exists)' })
  @ApiResponse({
    status: 200,
    description: 'Mapping toggled',
    type: ToggleMappingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Soul not found' })
  async toggleMapping(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() data: CreateMappingDto
  ): Promise<ToggleMappingResponseDto> {
    return this.matrixService.toggleMapping(
      data.soulId,
      data.integrationId,
      org.id,
      user.id
    );
  }

  @Post('/mappings/bulk')
  @ApiOperation({ summary: 'Perform bulk mapping operations' })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation results',
    type: BulkMappingResponseDto,
  })
  async bulkMappings(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() data: BulkMappingRequestDto
  ): Promise<BulkMappingResponseDto> {
    return this.matrixService.bulkOperations(data, org.id, user.id);
  }

  @Patch('/mappings/:id')
  @ApiOperation({ summary: 'Update a mapping' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  @ApiResponse({
    status: 200,
    description: 'Mapping updated successfully',
    type: MappingDto,
  })
  @ApiResponse({ status: 404, description: 'Mapping not found' })
  async updateMapping(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() data: UpdateMappingDto
  ): Promise<MappingDto> {
    return this.matrixService.updateMapping(id, data, org.id);
  }

  @Delete('/mappings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a mapping' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  @ApiResponse({ status: 204, description: 'Mapping deleted successfully' })
  @ApiResponse({ status: 404, description: 'Mapping not found' })
  async deleteMapping(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ): Promise<void> {
    await this.matrixService.deleteMapping(id, org.id);
  }

  @Get('/stats')
  @ApiOperation({ summary: 'Get matrix statistics' })
  @ApiResponse({
    status: 200,
    description: 'Matrix statistics',
  })
  async getStats(
    @GetOrgFromRequest() org: Organization
  ): Promise<{ mappingCount: number }> {
    const mappingCount = await this.matrixService.getMappingCount(org.id);
    return { mappingCount };
  }
}
