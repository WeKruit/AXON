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
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { SoulService } from '@gitroom/nestjs-libraries/database/firestore/collections/souls/soul.service';
import {
  CreateSoulDto,
  UpdateSoulDto,
  SoulListQueryDto,
  SoulResponseDto,
  SoulType,
} from '@gitroom/nestjs-libraries/dtos/axon';

@ApiTags('AXON - Souls')
@Controller('/axon/souls')
export class SoulsController {
  constructor(private readonly soulService: SoulService) {}

  @Post('/')
  @ApiOperation({ summary: 'Create a new soul' })
  @ApiResponse({ status: 201, description: 'Soul created successfully', type: SoulResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Soul with email/phone already exists' })
  async create(
    @GetOrgFromRequest() organization: Organization,
    @GetUserFromRequest() user: User,
    @Body() dto: CreateSoulDto
  ): Promise<SoulResponseDto> {
    return this.soulService.create(organization.id, dto, user.id);
  }

  @Get('/')
  @ApiOperation({ summary: 'List all souls' })
  @ApiResponse({ status: 200, description: 'List of souls' })
  @ApiQuery({ name: 'type', enum: SoulType, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'personaId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  async findAll(
    @GetOrgFromRequest() organization: Organization,
    @Query() query: SoulListQueryDto
  ): Promise<{ data: SoulResponseDto[]; hasMore: boolean }> {
    return this.soulService.findAll(organization.id, query);
  }

  @Get('/count')
  @ApiOperation({ summary: 'Get total soul count' })
  @ApiResponse({ status: 200, description: 'Total count of souls' })
  async getCount(
    @GetOrgFromRequest() organization: Organization
  ): Promise<{ count: number }> {
    const count = await this.soulService.getCount(organization.id);
    return { count };
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get a soul by ID' })
  @ApiParam({ name: 'id', description: 'Soul ID' })
  @ApiResponse({ status: 200, description: 'Soul details', type: SoulResponseDto })
  @ApiResponse({ status: 404, description: 'Soul not found' })
  async findById(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string
  ): Promise<SoulResponseDto> {
    return this.soulService.findById(organization.id, id);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update a soul' })
  @ApiParam({ name: 'id', description: 'Soul ID' })
  @ApiResponse({ status: 200, description: 'Soul updated successfully', type: SoulResponseDto })
  @ApiResponse({ status: 404, description: 'Soul not found' })
  @ApiResponse({ status: 409, description: 'Soul with email/phone already exists' })
  async update(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string,
    @Body() dto: UpdateSoulDto
  ): Promise<SoulResponseDto> {
    return this.soulService.update(organization.id, id, dto);
  }

  @Post('/:id/ensure-org')
  @ApiOperation({ summary: 'Ensure a soul-org exists for this soul (creates one if missing)' })
  @ApiParam({ name: 'id', description: 'Soul ID' })
  @ApiResponse({ status: 200, description: 'Soul with soulOrgId', type: SoulResponseDto })
  async ensureSoulOrg(
    @GetOrgFromRequest() organization: Organization,
    @GetUserFromRequest() user: User,
    @Param('id') id: string
  ): Promise<SoulResponseDto> {
    return this.soulService.ensureSoulOrg(organization.id, id, user.id);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a soul' })
  @ApiParam({ name: 'id', description: 'Soul ID' })
  @ApiResponse({ status: 204, description: 'Soul deleted successfully' })
  @ApiResponse({ status: 404, description: 'Soul not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete soul with associated accounts' })
  async delete(
    @GetOrgFromRequest() organization: Organization,
    @Param('id') id: string
  ): Promise<void> {
    await this.soulService.delete(organization.id, id);
  }
}
