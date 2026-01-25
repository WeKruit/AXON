import { initializeSentry } from '@gitroom/nestjs-libraries/sentry/initialize.sentry';
initializeSentry('backend', true);

import { loadSwagger } from '@gitroom/helpers/swagger/load.swagger';
import { json } from 'express';

// Temporal SDK initialization - optional for backend (only required by orchestrator)
try {
  const { Runtime } = require('@temporalio/worker');
  Runtime.install({ shutdownSignals: [] });
} catch (e) {
  // Temporal SDK initialization failed - this is OK for backend-only deployment
  // The orchestrator will handle Temporal connections
  console.log('Temporal SDK not initialized (optional for backend)');
}

process.env.TZ = 'UTC';

import cookieParser from 'cookie-parser';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { SubscriptionExceptionFilter } from '@gitroom/backend/services/auth/permissions/subscription.exception';
import { HttpExceptionFilter } from '@gitroom/nestjs-libraries/services/exception.filter';
import { ConfigurationChecker } from '@gitroom/helpers/configuration/configuration.checker';
import { startMcp } from '@gitroom/nestjs-libraries/chat/start.mcp';

async function start() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    cors: {
      ...(!process.env.NOT_SECURED ? { credentials: true } : {}),
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'auth',
        'x-copilotkit-runtime-client-gql-version',
      ],
      // Auth headers are always exposed to support:
      // 1. Custom 'auth' header for session token handling across subdomains
      // 2. 'reload' header to signal frontend to refresh data after mutations
      // 3. 'onboarding' header to trigger onboarding flows for new users
      // 4. 'activate' header for account activation workflows
      // 5. 'showorg' header for organization context switching
      // 6. 'impersonate' header for admin impersonation features
      // These headers must be exposed regardless of environment for consistent behavior
      exposedHeaders: [
        'reload',
        'onboarding',
        'activate',
        'auth',
        'showorg',
        'impersonate',
        'x-copilotkit-runtime-client-gql-version',
      ],
      origin: [
        process.env.FRONTEND_URL,
        'http://localhost:6274',
        ...(process.env.MAIN_URL ? [process.env.MAIN_URL] : []),
      ],
    },
  });

  // Defer MCP initialization to not block server startup
  // MCP will initialize on first request to /mcp/* endpoints
  setImmediate(async () => {
    try {
      await startMcp(app);
      Logger.log('MCP server initialized', 'MCP');
    } catch (e) {
      Logger.error('Failed to initialize MCP server', e, 'MCP');
    }
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    })
  );

  app.use('/copilot/*', (req: any, res: any, next: any) => {
    json({ limit: '50mb' })(req, res, next);
  });

  app.use(cookieParser());
  app.useGlobalFilters(new SubscriptionExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  loadSwagger(app);

  const port = process.env.PORT || 3000;

  try {
    await app.listen(port);

    checkConfiguration(); // Do this last, so that users will see obvious issues at the end of the startup log without having to scroll up.

    Logger.log(`🚀 Backend is running on: http://localhost:${port}`);
  } catch (e) {
    Logger.error(`Backend failed to start on port ${port}`, e);
  }
}

function checkConfiguration() {
  const checker = new ConfigurationChecker();
  checker.readEnvFromProcess();
  checker.check();

  if (checker.hasIssues()) {
    for (const issue of checker.getIssues()) {
      Logger.warn(issue, 'Configuration issue');
    }

    Logger.warn('Configuration issues found: ' + checker.getIssuesCount());
  } else {
    Logger.log('Configuration check completed without any issues');
  }
}

start();
