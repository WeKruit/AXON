import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  ProxyType,
  ProxyLocation,
  ProxyCredentials,
} from '@gitroom/nestjs-libraries/dtos/axon';

export interface IPRoyalConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface IPRoyalProxyInfo {
  id: string;
  type: 'residential' | 'mobile' | 'datacenter' | 'isp';
  host: string;
  port: number;
  username: string;
  password: string;
  country?: string;
  city?: string;
  isp?: string;
  asn?: string;
  expiresAt?: Date;
  bandwidthUsed?: number;
  bandwidthLimit?: number;
}

export interface IPRoyalAccountInfo {
  balance: number;
  currency: string;
  email: string;
  activeProxies: number;
  bandwidthUsed: number;
  bandwidthLimit: number;
}

export interface IPRoyalProxyListResponse {
  data: IPRoyalProxyInfo[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IPRoyalRotateResponse {
  success: boolean;
  newIp?: string;
  error?: string;
}

export interface IPRoyalHealthCheckResponse {
  healthy: boolean;
  currentIp: string;
  responseTime: number;
  location?: {
    country: string;
    city?: string;
    isp?: string;
  };
}

@Injectable()
export class IPRoyalClient {
  private client: AxiosInstance;
  private readonly logger = new Logger(IPRoyalClient.name);
  private readonly baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.IPROYAL_API_URL || 'https://api.iproyal.com/v1';
    this.apiKey = process.env.IPROYAL_API_KEY || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  configure(config: IPRoyalConfig): void {
    this.apiKey = config.apiKey;
    if (config.baseUrl) {
      this.client.defaults.baseURL = config.baseUrl;
    }
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async getAccountInfo(): Promise<IPRoyalAccountInfo> {
    try {
      const response = await this.client.get('/account', {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get IPRoyal account info', error);
      throw this.handleError(error);
    }
  }

  async listProxies(page = 1, pageSize = 50): Promise<IPRoyalProxyListResponse> {
    try {
      const response = await this.client.get('/proxies', {
        headers: this.getAuthHeaders(),
        params: { page, pageSize },
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list IPRoyal proxies', error);
      throw this.handleError(error);
    }
  }

  async getProxy(proxyId: string): Promise<IPRoyalProxyInfo> {
    try {
      const response = await this.client.get(`/proxies/${proxyId}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get IPRoyal proxy ${proxyId}`, error);
      throw this.handleError(error);
    }
  }

  async rotateProxy(proxyId: string): Promise<IPRoyalRotateResponse> {
    try {
      const response = await this.client.post(
        `/proxies/${proxyId}/rotate`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to rotate IPRoyal proxy ${proxyId}`, error);
      throw this.handleError(error);
    }
  }

  async checkProxyHealth(proxyId: string): Promise<IPRoyalHealthCheckResponse> {
    try {
      const response = await this.client.get(`/proxies/${proxyId}/health`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to check IPRoyal proxy health ${proxyId}`, error);
      throw this.handleError(error);
    }
  }

  async testProxyConnection(credentials: ProxyCredentials): Promise<{
    success: boolean;
    ip?: string;
    responseTime?: number;
    error?: string;
  }> {
    try {
      const proxyUrl = this.buildProxyUrl(credentials);
      const startTime = Date.now();

      // Make a test request through the proxy
      const response = await axios.get('https://api.ipify.org?format=json', {
        proxy: {
          host: credentials.host,
          port: credentials.port,
          auth: credentials.username && credentials.password
            ? { username: credentials.username, password: credentials.password }
            : undefined,
          protocol: credentials.protocol || 'http',
        },
        timeout: 10000,
      });

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        ip: response.data.ip,
        responseTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async purchaseProxy(options: {
    type: 'residential' | 'mobile' | 'datacenter' | 'isp';
    country?: string;
    city?: string;
    duration?: number; // in days
    quantity?: number;
  }): Promise<IPRoyalProxyInfo[]> {
    try {
      const response = await this.client.post(
        '/proxies/purchase',
        options,
        { headers: this.getAuthHeaders() }
      );
      return response.data.proxies;
    } catch (error) {
      this.logger.error('Failed to purchase IPRoyal proxies', error);
      throw this.handleError(error);
    }
  }

  async extendProxy(proxyId: string, days: number): Promise<IPRoyalProxyInfo> {
    try {
      const response = await this.client.post(
        `/proxies/${proxyId}/extend`,
        { days },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to extend IPRoyal proxy ${proxyId}`, error);
      throw this.handleError(error);
    }
  }

  // Convert IPRoyal proxy info to our internal format
  toProxyCredentials(info: IPRoyalProxyInfo): ProxyCredentials {
    return {
      host: info.host,
      port: info.port,
      username: info.username,
      password: info.password,
      protocol: 'http',
    };
  }

  toProxyLocation(info: IPRoyalProxyInfo): ProxyLocation {
    return {
      country: info.country,
      city: info.city,
      isp: info.isp,
      asn: info.asn,
    };
  }

  toProxyType(ipRoyalType: string): ProxyType {
    const typeMap: Record<string, ProxyType> = {
      residential: ProxyType.RESIDENTIAL,
      mobile: ProxyType.MOBILE,
      datacenter: ProxyType.DATACENTER,
      isp: ProxyType.ISP,
    };
    return typeMap[ipRoyalType] || ProxyType.RESIDENTIAL;
  }

  private buildProxyUrl(credentials: ProxyCredentials): string {
    const protocol = credentials.protocol || 'http';
    const auth = credentials.username && credentials.password
      ? `${credentials.username}:${credentials.password}@`
      : '';
    return `${protocol}://${auth}${credentials.host}:${credentials.port}`;
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const message = error.response.data?.message || error.response.statusText;
        return new Error(`IPRoyal API error: ${message} (${error.response.status})`);
      }
      if (error.request) {
        return new Error('IPRoyal API: No response received');
      }
    }
    return error instanceof Error ? error : new Error('Unknown IPRoyal API error');
  }
}
