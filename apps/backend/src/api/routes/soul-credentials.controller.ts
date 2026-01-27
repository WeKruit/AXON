import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SoulCredentialsService } from '@gitroom/nestjs-libraries/database/firestore/collections/soul-credentials/soul-credentials.service';

class UpsertCredentialsDto {
  clientId: string;
  clientSecret: string;
  additionalConfig?: Record<string, string>;
}

@ApiTags('AXON - Soul Credentials')
@Controller('/axon/souls/:soulId/credentials')
export class SoulCredentialsController {
  constructor(private readonly credentialsService: SoulCredentialsService) {}

  @Get('/')
  @ApiOperation({ summary: 'List all platform credentials for a soul' })
  @ApiParam({ name: 'soulId', description: 'Soul ID' })
  @ApiResponse({ status: 200, description: 'List of credentials (secrets masked)' })
  async listCredentials(
    @GetOrgFromRequest() organization: Organization,
    @Param('soulId') soulId: string,
  ) {
    return this.credentialsService.listCredentials(soulId);
  }

  @Put('/:platform')
  @ApiOperation({ summary: 'Upsert credentials for a platform' })
  @ApiParam({ name: 'soulId', description: 'Soul ID' })
  @ApiParam({ name: 'platform', description: 'Platform identifier (e.g. twitter, linkedin)' })
  @ApiResponse({ status: 200, description: 'Credentials saved (secret masked)' })
  async upsertCredentials(
    @GetOrgFromRequest() organization: Organization,
    @Param('soulId') soulId: string,
    @Param('platform') platform: string,
    @Body() dto: UpsertCredentialsDto,
  ) {
    return this.credentialsService.upsertCredentials(
      soulId,
      organization.id,
      platform,
      dto.clientId,
      dto.clientSecret,
      dto.additionalConfig,
    );
  }

  @Delete('/:platform')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete credentials for a platform' })
  @ApiParam({ name: 'soulId', description: 'Soul ID' })
  @ApiParam({ name: 'platform', description: 'Platform identifier' })
  @ApiResponse({ status: 204, description: 'Credentials deleted' })
  async deleteCredentials(
    @GetOrgFromRequest() organization: Organization,
    @Param('soulId') soulId: string,
    @Param('platform') platform: string,
  ): Promise<void> {
    await this.credentialsService.deleteCredentials(soulId, platform);
  }
}
