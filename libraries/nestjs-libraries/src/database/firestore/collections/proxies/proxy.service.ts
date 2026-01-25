import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProxyRepository } from './proxy.repository';
import {
  Proxy,
  CreateProxyDto,
  UpdateProxyDto,
  ProxyListQueryDto,
  ProxyResponseDto,
  ProxyHealthCheckDto,
  ProxyCredentials,
  ProxyStatus,
  ProxyPurpose,
  ProxyType,
  PROXY_PURPOSE_MATRIX,
} from '@gitroom/nestjs-libraries/dtos/axon';
import { AuthService } from '@gitroom/helpers/auth/auth.service';

@Injectable()
export class ProxyService {
  constructor(private readonly proxyRepository: ProxyRepository) {}

  async create(organizationId: string, dto: CreateProxyDto): Promise<ProxyResponseDto> {
    // Validate proxy type is compatible with purposes
    for (const purpose of dto.purposes) {
      const allowedTypes = PROXY_PURPOSE_MATRIX[purpose];
      if (!allowedTypes.includes(dto.type)) {
        throw new BadRequestException(
          `Proxy type '${dto.type}' is not suitable for purpose '${purpose}'. ` +
            `Allowed types: ${allowedTypes.join(', ')}`
        );
      }
    }

    // Check for duplicate external ID if provided
    if (dto.externalId) {
      const existing = await this.proxyRepository.findByExternalId(organizationId, dto.externalId);
      if (existing) {
        throw new ConflictException('A proxy with this external ID already exists');
      }
    }

    // Encrypt credentials before storing
    const encryptedCredentials = this.encryptCredentials(dto.credentials);
    const proxy = await this.proxyRepository.create(organizationId, {
      ...dto,
      credentials: encryptedCredentials,
    });
    return this.toResponseDto(proxy);
  }

  async findById(organizationId: string, id: string): Promise<ProxyResponseDto> {
    const proxy = await this.proxyRepository.findById(organizationId, id);
    if (!proxy) {
      throw new NotFoundException('Proxy not found');
    }
    return this.toResponseDto(proxy);
  }

  async findAll(
    organizationId: string,
    query: ProxyListQueryDto
  ): Promise<{ data: ProxyResponseDto[]; hasMore: boolean }> {
    const result = await this.proxyRepository.findAll(organizationId, query);
    return {
      data: result.data.map((proxy) => this.toResponseDto(proxy)),
      hasMore: result.hasMore,
    };
  }

  async findAvailableForPurpose(
    organizationId: string,
    purpose: ProxyPurpose
  ): Promise<ProxyResponseDto[]> {
    const proxies = await this.proxyRepository.findAvailableForPurpose(organizationId, purpose);
    return proxies.map((proxy) => this.toResponseDto(proxy));
  }

  async update(organizationId: string, id: string, dto: UpdateProxyDto): Promise<ProxyResponseDto> {
    const existing = await this.proxyRepository.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Proxy not found');
    }

    // Validate proxy type is compatible with purposes if both are being updated
    const newType = dto.type || existing.type;
    const newPurposes = dto.purposes || existing.purposes;

    for (const purpose of newPurposes) {
      const allowedTypes = PROXY_PURPOSE_MATRIX[purpose];
      if (!allowedTypes.includes(newType)) {
        throw new BadRequestException(
          `Proxy type '${newType}' is not suitable for purpose '${purpose}'. ` +
            `Allowed types: ${allowedTypes.join(', ')}`
        );
      }
    }

    // Encrypt credentials if being updated
    const updateData = { ...dto };
    if (dto.credentials) {
      updateData.credentials = this.encryptCredentials(dto.credentials);
    }

    await this.proxyRepository.update(organizationId, id, updateData);
    return this.findById(organizationId, id);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const existing = await this.proxyRepository.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Proxy not found');
    }

    // Check if proxy has assigned accounts
    if (existing.assignedAccountIds && existing.assignedAccountIds.length > 0) {
      throw new ConflictException(
        'Cannot delete proxy with assigned accounts. Unassign all accounts first.'
      );
    }

    await this.proxyRepository.delete(organizationId, id);
  }

  async assignAccount(organizationId: string, proxyId: string, accountId: string): Promise<void> {
    const proxy = await this.proxyRepository.findById(organizationId, proxyId);
    if (!proxy) {
      throw new NotFoundException('Proxy not found');
    }

    if (proxy.status !== ProxyStatus.ACTIVE) {
      throw new BadRequestException('Cannot assign account to inactive proxy');
    }

    await this.proxyRepository.assignAccount(organizationId, proxyId, accountId);
  }

  async unassignAccount(organizationId: string, proxyId: string, accountId: string): Promise<void> {
    await this.proxyRepository.unassignAccount(organizationId, proxyId, accountId);
  }

  async updateStatus(organizationId: string, id: string, status: ProxyStatus): Promise<ProxyResponseDto> {
    const existing = await this.proxyRepository.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Proxy not found');
    }

    await this.proxyRepository.updateStatus(organizationId, id, status);
    return this.findById(organizationId, id);
  }

  async healthCheck(organizationId: string, id: string): Promise<ProxyHealthCheckDto> {
    const proxy = await this.proxyRepository.findById(organizationId, id);
    if (!proxy) {
      throw new NotFoundException('Proxy not found');
    }

    // Basic health check implementation
    // In a real implementation, this would actually test the proxy connection
    const healthCheck: ProxyHealthCheckDto = {
      healthy: proxy.status === ProxyStatus.ACTIVE,
      checkedAt: new Date(),
    };

    // TODO: Implement actual proxy health check
    // This would involve making a request through the proxy to verify it's working

    return healthCheck;
  }

  async getCount(organizationId: string): Promise<number> {
    return this.proxyRepository.count(organizationId);
  }

  async getCountByStatus(organizationId: string, status: ProxyStatus): Promise<number> {
    return this.proxyRepository.countByStatus(organizationId, status);
  }

  /**
   * Get all counts in parallel to avoid N+1 query problem
   */
  async getAllCounts(organizationId: string): Promise<{
    total: number;
    byStatus: Record<ProxyStatus, number>;
  }> {
    const statusValues = Object.values(ProxyStatus);

    // Execute all count queries in parallel
    const [total, ...statusCounts] = await Promise.all([
      this.proxyRepository.count(organizationId),
      ...statusValues.map((status) => this.proxyRepository.countByStatus(organizationId, status)),
    ]);

    // Build status counts object
    const byStatus = {} as Record<ProxyStatus, number>;
    statusValues.forEach((status, index) => {
      byStatus[status] = statusCounts[index];
    });

    return { total, byStatus };
  }

  validateProxyPurposeMatrix(type: ProxyType, purpose: ProxyPurpose): boolean {
    const allowedTypes = PROXY_PURPOSE_MATRIX[purpose];
    return allowedTypes.includes(type);
  }

  getRecommendedProxyTypes(purpose: ProxyPurpose): ProxyType[] {
    return PROXY_PURPOSE_MATRIX[purpose];
  }

  private encryptCredentials(credentials: ProxyCredentials): ProxyCredentials {
    const encrypted = { ...credentials };
    if (encrypted.password) {
      encrypted.password = AuthService.fixedEncryption(encrypted.password);
    }
    return encrypted;
  }

  private toResponseDto(proxy: Proxy): ProxyResponseDto {
    return {
      id: proxy.id,
      organizationId: proxy.organizationId,
      name: proxy.name,
      provider: proxy.provider,
      type: proxy.type,
      purposes: proxy.purposes,
      status: proxy.status,
      location: proxy.location,
      metrics: proxy.metrics,
      externalId: proxy.externalId,
      expiresAt: proxy.expiresAt,
      assignedAccountCount: (proxy.assignedAccountIds || []).length,
      tags: proxy.tags,
      createdAt: proxy.createdAt instanceof Date ? proxy.createdAt : new Date((proxy.createdAt as any)._seconds * 1000),
      updatedAt: proxy.updatedAt instanceof Date ? proxy.updatedAt : new Date((proxy.updatedAt as any)._seconds * 1000),
    };
  }
}
