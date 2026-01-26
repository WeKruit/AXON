/**
 * LLM Module - WEC-142
 *
 * NestJS module that provides the LLM factory and related services.
 * Exports all LLM providers and the factory for use across the application.
 */

import { Global, Module } from '@nestjs/common';
import { LLMFactory } from './llm.factory';
import { LLMService } from './llm.service';

@Global()
@Module({
  providers: [LLMFactory, LLMService],
  exports: [LLMFactory, LLMService],
})
export class LLMModule {}
