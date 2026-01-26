import { Module } from '@nestjs/common';
import { CommandModule as ExternalCommandModule } from 'nestjs-command';
import { DatabaseModule } from '@gitroom/nestjs-libraries/database/prisma/database.module';
import { RefreshTokens } from './tasks/refresh.tokens';
import { ConfigurationTask } from './tasks/configuration';
import { AgentRun } from './tasks/agent.run';
import { AgentModule } from '@gitroom/nestjs-libraries/agent/agent.module';
import { FirestoreModule } from '@gitroom/nestjs-libraries/database/firestore/firestore.module';
import { AxonSeedTask } from './tasks/axon.seed';

@Module({
  imports: [ExternalCommandModule, DatabaseModule, AgentModule, FirestoreModule],
  controllers: [],
  providers: [RefreshTokens, ConfigurationTask, AgentRun, AxonSeedTask],
  get exports() {
    return [...this.imports, ...this.providers];
  },
})
export class CommandModule {}
