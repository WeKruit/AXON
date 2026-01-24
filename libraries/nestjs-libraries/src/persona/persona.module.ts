/**
 * Persona Module - WEC-146
 *
 * NestJS module that provides Persona services.
 */

import { Global, Module } from '@nestjs/common';
import { PersonaRepository } from './persona.repository';
import { PersonaService } from './persona.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { LLMModule } from '../llm/llm.module';

@Global()
@Module({
  imports: [FirebaseModule, LLMModule],
  providers: [PersonaRepository, PersonaService],
  exports: [PersonaService],
})
export class PersonaModule {}
