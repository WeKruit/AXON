'use client';

import { FC, useState } from 'react';
import { PlatformAuthConfig, CredentialField } from '../config/platform-auth-config';

interface PlatformSetupGuideProps {
  config: PlatformAuthConfig;
  fieldValues: Record<string, string>;
  onFieldChange: (key: string, value: string) => void;
  backendUrl: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 px-2 py-0.5 text-xs bg-newBgLineColor rounded hover:bg-newBgLineColor/80 transition-colors shrink-0"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function StepItem({ index, step, redirectUri }: { index: number; step: PlatformAuthConfig['setupSteps'][0]; redirectUri: string }) {
  // If the step mentions "Redirect URI", show the copyable URI
  const showRedirectUri = step.title.toLowerCase().includes('redirect uri') || step.title.toLowerCase().includes('callback');

  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-newBgLineColor text-xs flex items-center justify-center font-medium mt-0.5">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{step.title}</p>
        {step.description && (
          <p className="text-xs text-textItemBlur mt-0.5">{step.description}</p>
        )}
        {step.link && (
          <a
            href={step.link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-btnPrimary hover:underline mt-1"
          >
            {step.link.label} &rarr;
          </a>
        )}
        {step.checklist && step.checklist.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {step.checklist.map((item, i) => (
              <li key={i} className="text-xs text-textItemBlur flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-textItemBlur shrink-0" />
                <code className="bg-newBgColorInner px-1 rounded">{item}</code>
              </li>
            ))}
          </ul>
        )}
        {step.copyableText && (
          <div className="mt-1 flex items-center bg-newBgColorInner border border-newTableBorder rounded px-2 py-1">
            <code className="text-xs break-all flex-1">{step.copyableText}</code>
            <CopyButton text={step.copyableText} />
          </div>
        )}
        {showRedirectUri && (
          <div className="mt-1 flex items-center bg-newBgColorInner border border-newTableBorder rounded px-2 py-1">
            <code className="text-xs break-all flex-1">{redirectUri}</code>
            <CopyButton text={redirectUri} />
          </div>
        )}
      </div>
    </li>
  );
}

function FieldInput({ field, value, onChange }: { field: CredentialField; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={field.type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full px-3 py-2 text-sm bg-newBgColorInner border border-newTableBorder rounded-lg focus:border-btnPrimary focus:outline-none"
      />
    </div>
  );
}

export const PlatformSetupGuide: FC<PlatformSetupGuideProps> = ({
  config,
  fieldValues,
  onFieldChange,
  backendUrl,
}) => {
  const redirectUri = `${backendUrl}${config.redirectUriPath}`;

  return (
    <div className="space-y-4">
      {/* Setup steps */}
      {config.setupSteps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-textItemBlur uppercase tracking-wide">Setup Steps</h3>
          <ol className="space-y-3">
            {config.setupSteps.map((step, i) => (
              <StepItem key={i} index={i} step={step} redirectUri={redirectUri} />
            ))}
          </ol>
        </div>
      )}

      {/* Special requirements */}
      {config.specialRequirements && config.specialRequirements.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-xs font-medium text-yellow-400 mb-1">Requirements</p>
          <ul className="space-y-0.5">
            {config.specialRequirements.map((req, i) => (
              <li key={i} className="text-xs text-yellow-300/80 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">&#x26A0;</span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Developer portal link */}
      {config.developerPortalUrl && (
        <a
          href={config.developerPortalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-btnPrimary hover:underline"
        >
          Open Developer Portal &rarr;
        </a>
      )}

      {/* Credential fields */}
      <div className="border-t border-newTableBorder pt-4">
        <h3 className="text-sm font-semibold mb-3 text-textItemBlur uppercase tracking-wide">Credentials</h3>
        <div className="space-y-3">
          {config.fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={fieldValues[field.key] || ''}
              onChange={(v) => onFieldChange(field.key, v)}
            />
          ))}
        </div>
      </div>

      {/* Env var reference */}
      {config.envVarNames.length > 0 && (
        <details className="text-xs text-textItemBlur">
          <summary className="cursor-pointer hover:text-newTextColor">Env var reference</summary>
          <div className="mt-1 bg-newBgColorInner border border-newTableBorder rounded p-2 space-y-0.5">
            {config.envVarNames.map((v) => (
              <div key={v} className="font-mono">{v}</div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
