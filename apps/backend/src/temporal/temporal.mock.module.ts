import { Module, Global, Injectable } from '@nestjs/common';
import { TemporalService as RealTemporalService } from 'nestjs-temporal-core';

/**
 * Mock TemporalService for when Temporal is disabled (SKIP_TEMPORAL=true)
 * Provides no-op implementations for all Temporal operations
 *
 * We provide this using the same token as the real TemporalService from 'nestjs-temporal-core'
 * so that NestJS DI will inject this mock where the real TemporalService is expected.
 */
@Injectable()
export class MockTemporalService {
  client = null; // No Temporal client available

  async startWorkflow(): Promise<any> {
    console.log('[MockTemporal] startWorkflow called - no-op in backend-only mode');
    return { workflowId: 'mock-workflow-id', runId: 'mock-run-id' };
  }

  async getWorkflowHandle(): Promise<any> {
    console.log('[MockTemporal] getWorkflowHandle called - no-op in backend-only mode');
    return {
      signal: async () => {},
      query: async () => null,
      result: async () => null,
      terminate: async () => {},
      cancel: async () => {},
    };
  }

  async signalWorkflow(): Promise<void> {
    console.log('[MockTemporal] signalWorkflow called - no-op in backend-only mode');
  }

  async terminateWorkflow(): Promise<void> {
    console.log('[MockTemporal] terminateWorkflow called - no-op in backend-only mode');
  }

  getClient(): any {
    return null;
  }
}

@Global()
@Module({
  providers: [
    {
      provide: RealTemporalService,
      useClass: MockTemporalService,
    },
  ],
  exports: [RealTemporalService],
})
export class MockTemporalModule {}
