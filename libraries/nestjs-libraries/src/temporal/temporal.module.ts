import { TemporalModule } from 'nestjs-temporal-core';
import { socialIntegrationList } from '@gitroom/nestjs-libraries/integrations/integration.manager';

export const getTemporalModule = (
  isWorkers: boolean,
  path?: string,
  activityClasses?: any[]
) => {
  // Determine if we should use TLS (for Fly.io or other external deployments)
  const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  // Only enable TLS if explicitly set to 'true', not based on hostname
  const useTls = process.env.TEMPORAL_TLS === 'true';

  return TemporalModule.register({
    isGlobal: true,
    connection: {
      address,
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
      ...(useTls ? { tls: true } : {}),
    },
    taskQueue: 'main',
    logLevel: 'error',
    ...(isWorkers
      ? {
          workers: [
            { identifier: 'main', maxConcurrentJob: undefined },
            ...socialIntegrationList,
          ]
            .filter((f) => f.identifier.indexOf('-') === -1)
            .map((integration) => ({
              taskQueue: integration.identifier.split('-')[0],
              workflowsPath: path!,
              activityClasses: activityClasses!,
              autoStart: true,
              ...(integration.maxConcurrentJob
                ? {
                    workerOptions: {
                      maxConcurrentActivityTaskExecutions:
                        integration.maxConcurrentJob,
                    },
                  }
                : {}),
            })),
        }
      : {}),
  });
};
