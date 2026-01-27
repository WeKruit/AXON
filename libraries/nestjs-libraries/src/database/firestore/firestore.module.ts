import { Global, Module } from '@nestjs/common';
import { FirestoreService } from './firestore.service';
import { SoulRepository } from './collections/souls/soul.repository';
import { SoulService } from './collections/souls/soul.service';
import { AccountRepository } from './collections/accounts/account.repository';
import { AccountService } from './collections/accounts/account.service';
import { ProxyRepository } from './collections/proxies/proxy.repository';
import { ProxyService } from './collections/proxies/proxy.service';
import { IPRoyalClient } from '@gitroom/nestjs-libraries/proxy-providers';
import { SoulCredentialsRepository } from './collections/soul-credentials/soul-credentials.repository';
import { SoulCredentialsService } from './collections/soul-credentials/soul-credentials.service';

@Global()
@Module({
  providers: [
    FirestoreService,
    SoulRepository,
    SoulService,
    AccountRepository,
    AccountService,
    ProxyRepository,
    ProxyService,
    IPRoyalClient,
    SoulCredentialsRepository,
    SoulCredentialsService,
  ],
  exports: [
    FirestoreService,
    SoulRepository,
    SoulService,
    AccountRepository,
    AccountService,
    ProxyRepository,
    ProxyService,
    IPRoyalClient,
    SoulCredentialsRepository,
    SoulCredentialsService,
  ],
})
export class FirestoreModule {}
