export type AuthCategory =
  | 'zero-config'
  | 'simple-oauth'
  | 'oauth-plus-bot'
  | 'meta-ecosystem'
  | 'google-cloud'
  | 'api-registration';

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  required: boolean;
  /** Where this field maps in the save payload */
  storageKey: 'clientId' | 'clientSecret' | 'additionalConfig';
  /** If storageKey is 'additionalConfig', the key within that object */
  additionalConfigKey?: string;
}

export interface SetupStep {
  title: string;
  description?: string;
  link?: { label: string; url: string };
  /** Text the user can copy (redirect URI, curl command, etc.) */
  copyableText?: string;
  /** Sub-items like required scopes/permissions */
  checklist?: string[];
}

export interface PlatformAuthConfig {
  identifier: string;
  label: string;
  category: AuthCategory;
  developerPortalUrl: string;
  /** Path appended to the backend URL for the OAuth callback, e.g. '/integrations/social/x' */
  redirectUriPath: string;
  tutorialUrl?: string;
  fields: CredentialField[];
  setupSteps: SetupStep[];
  specialRequirements?: string[];
  /** Env var names shown for reference */
  envVarNames: string[];
}

// ---------------------------------------------------------------------------
// Per-platform configs
// ---------------------------------------------------------------------------

const x: PlatformAuthConfig = {
  identifier: 'x',
  label: 'X (Twitter)',
  category: 'simple-oauth',
  developerPortalUrl: 'https://developer.x.com/en/portal/dashboard',
  redirectUriPath: '/integrations/social/x',
  fields: [
    { key: 'clientId', label: 'API Key (Consumer Key)', type: 'text', placeholder: 'Enter API Key', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'API Secret (Consumer Secret)', type: 'password', placeholder: 'Enter API Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Create a project & app on the X Developer Portal', link: { label: 'Open X Developer Portal', url: 'https://developer.x.com/en/portal/dashboard' } },
    { title: 'Set App Permissions to "Read and Write"' },
    { title: 'Set App Type to "Web App, Automated App or Bot"' },
    { title: 'Add the Callback / Redirect URI', description: 'Paste the URL below into your app\'s Authentication settings.' },
    { title: 'Copy the Consumer Keys (API Key & Secret)', description: 'Go to Keys and Tokens and regenerate Consumer Keys.' },
  ],
  envVarNames: ['X_API_KEY', 'X_API_SECRET'],
};

const linkedin: PlatformAuthConfig = {
  identifier: 'linkedin',
  label: 'LinkedIn',
  category: 'simple-oauth',
  developerPortalUrl: 'https://www.linkedin.com/developers/apps',
  redirectUriPath: '/integrations/social/linkedin',
  fields: [
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Client ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Create an app on LinkedIn Developers', link: { label: 'Open LinkedIn Developers', url: 'https://www.linkedin.com/developers/apps' } },
    { title: 'Add required products', checklist: ['Share on LinkedIn', 'Sign In with LinkedIn using OpenID Connect'] },
    { title: 'Add the Redirect URI under OAuth 2.0 settings' },
  ],
  envVarNames: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
};

const linkedinPage: PlatformAuthConfig = {
  identifier: 'linkedin-page',
  label: 'LinkedIn Page',
  category: 'simple-oauth',
  developerPortalUrl: 'https://www.linkedin.com/developers/apps',
  redirectUriPath: '/integrations/social/linkedin-page',
  fields: [
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Client ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Create an app on LinkedIn Developers', link: { label: 'Open LinkedIn Developers', url: 'https://www.linkedin.com/developers/apps' } },
    { title: 'Add required products', checklist: ['Share on LinkedIn', 'Sign In with LinkedIn using OpenID Connect', 'Advertising API'] },
    { title: 'Verify your app with a LinkedIn Page (required for page posting)' },
    { title: 'Add the Redirect URI under OAuth 2.0 settings' },
  ],
  envVarNames: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
};

const reddit: PlatformAuthConfig = {
  identifier: 'reddit',
  label: 'Reddit',
  category: 'simple-oauth',
  developerPortalUrl: 'https://www.reddit.com/prefs/apps',
  redirectUriPath: '/integrations/social/reddit',
  fields: [
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Client ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Create a "web app" at Reddit App Preferences', link: { label: 'Open Reddit Apps', url: 'https://www.reddit.com/prefs/apps' } },
    { title: 'Set the Redirect URI' },
  ],
  envVarNames: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'],
};

const facebook: PlatformAuthConfig = {
  identifier: 'facebook',
  label: 'Facebook Page',
  category: 'meta-ecosystem',
  developerPortalUrl: 'https://developers.facebook.com/apps/',
  redirectUriPath: '/integrations/social/facebook',
  fields: [
    { key: 'clientId', label: 'App ID', type: 'text', placeholder: 'Enter Facebook App ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'App Secret', type: 'password', placeholder: 'Enter App Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Create a Meta Developer App', link: { label: 'Open Meta Developers', url: 'https://developers.facebook.com/apps/' }, description: 'Select "Other" app type, then "Business" category.' },
    { title: 'Add "Facebook Login for Business" product' },
    { title: 'Set the Redirect URI under Facebook Login > Settings' },
    { title: 'Request advanced permissions', checklist: ['pages_show_list', 'business_management', 'pages_manage_posts', 'pages_manage_engagement', 'pages_read_engagement', 'read_insights'] },
    { title: 'Set App Mode to "Live"' },
    { title: 'Copy App ID & App Secret from Settings > Basic' },
  ],
  envVarNames: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
};

const instagram: PlatformAuthConfig = {
  identifier: 'instagram',
  label: 'Instagram (Facebook Business)',
  category: 'meta-ecosystem',
  developerPortalUrl: 'https://developers.facebook.com/apps/',
  redirectUriPath: '/integrations/social/instagram',
  fields: [
    { key: 'clientId', label: 'App ID', type: 'text', placeholder: 'Enter Facebook App ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'App Secret', type: 'password', placeholder: 'Enter App Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Use the same Meta Developer App as Facebook', link: { label: 'Open Meta Developers', url: 'https://developers.facebook.com/apps/' } },
    { title: 'Ensure Instagram Business account is linked to a Facebook Page' },
    { title: 'Add "Instagram Graph API" product' },
    { title: 'Request permissions', checklist: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'] },
    { title: 'Set the Redirect URI' },
  ],
  envVarNames: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
};

const instagramStandalone: PlatformAuthConfig = {
  identifier: 'instagram-standalone',
  label: 'Instagram (Standalone)',
  category: 'meta-ecosystem',
  developerPortalUrl: 'https://developers.facebook.com/apps/',
  redirectUriPath: '/integrations/social/instagram-standalone',
  fields: [
    { key: 'clientId', label: 'Instagram App ID', type: 'text', placeholder: 'Enter Instagram App ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'Instagram App Secret', type: 'password', placeholder: 'Enter App Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Create a Meta Developer App for Instagram', link: { label: 'Open Meta Developers', url: 'https://developers.facebook.com/apps/' } },
    { title: 'Add "Instagram" product (not Instagram Graph API)' },
    { title: 'Ensure you have a Professional Instagram account' },
    { title: 'Set the Redirect URI' },
  ],
  envVarNames: ['INSTAGRAM_APP_ID', 'INSTAGRAM_APP_SECRET'],
};

const threads: PlatformAuthConfig = {
  identifier: 'threads',
  label: 'Threads',
  category: 'meta-ecosystem',
  developerPortalUrl: 'https://developers.facebook.com/apps/',
  redirectUriPath: '/integrations/social/threads',
  fields: [
    { key: 'clientId', label: 'Threads App ID', type: 'text', placeholder: 'Enter Threads App ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'Threads App Secret', type: 'password', placeholder: 'Enter App Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Create a Meta Developer App', link: { label: 'Open Meta Developers', url: 'https://developers.facebook.com/apps/' }, description: 'Select "Access the Threads API" use case.' },
    { title: 'Fill in business details and create app' },
    { title: 'Configure Threads API settings and add Redirect URI' },
    { title: 'Add yourself as a Threads tester', description: 'Use Cases > Customize > Add Testers' },
    { title: 'Accept the tester invite on threads.net', link: { label: 'Open Threads Settings', url: 'https://www.threads.net/settings/account' } },
    { title: 'Verify access in Graph API Explorer', link: { label: 'Open Graph API Explorer', url: 'https://developers.facebook.com/tools/explorer/' } },
    { title: 'Copy App ID & Secret from Settings > Basic' },
  ],
  specialRequirements: ['Complex setup (~30-45 min)', 'Tester invitation required before going live'],
  envVarNames: ['THREADS_APP_ID', 'THREADS_APP_SECRET'],
};

const youtube: PlatformAuthConfig = {
  identifier: 'youtube',
  label: 'YouTube',
  category: 'google-cloud',
  developerPortalUrl: 'https://console.cloud.google.com/apis/dashboard',
  redirectUriPath: '/integrations/social/youtube',
  fields: [
    { key: 'clientId', label: 'OAuth Client ID', type: 'text', placeholder: 'Enter OAuth Client ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Create or select a project in Google Cloud Console', link: { label: 'Open Cloud Console', url: 'https://console.cloud.google.com/' } },
    { title: 'Enable required APIs', checklist: ['YouTube Data API v3', 'YouTube Analytics API', 'YouTube Reporting API'] },
    { title: 'Configure OAuth Consent Screen', description: 'User type: External. Add yourself as a test user.' },
    { title: 'Create OAuth 2.0 Client ID', description: 'Application type: Web application. Add the Redirect URI.' },
    { title: 'Copy the Client ID & Client Secret' },
  ],
  envVarNames: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
};

const tiktok: PlatformAuthConfig = {
  identifier: 'tiktok',
  label: 'TikTok',
  category: 'api-registration',
  developerPortalUrl: 'https://developers.tiktok.com/',
  redirectUriPath: '/integrations/social/tiktok',
  fields: [
    { key: 'clientId', label: 'Client Key', type: 'text', placeholder: 'Enter Client Key', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Create an app on TikTok for Developers', link: { label: 'Open TikTok Developers', url: 'https://developers.tiktok.com/' } },
    { title: 'Set Terms of Service & Privacy Policy URLs', description: 'Must be on a public HTTPS domain.' },
    { title: 'Add products', checklist: ['Login Kit', 'Content Posting API (enable "Direct Post")'] },
    { title: 'Add required scopes', checklist: ['user.info.basic', 'user.info.profile', 'video.create', 'video.publish', 'video.upload'] },
    { title: 'Add the Redirect URI' },
  ],
  specialRequirements: ['HTTPS required for redirect URI', 'Public website needed for verification', 'Media must be publicly accessible URLs'],
  envVarNames: ['TIKTOK_CLIENT_ID', 'TIKTOK_CLIENT_SECRET'],
};

const pinterest: PlatformAuthConfig = {
  identifier: 'pinterest',
  label: 'Pinterest',
  category: 'simple-oauth',
  developerPortalUrl: 'https://developers.pinterest.com/apps/',
  redirectUriPath: '/integrations/social/pinterest',
  fields: [
    { key: 'clientId', label: 'App ID', type: 'text', placeholder: 'Enter App ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'App Secret', type: 'password', placeholder: 'Enter App Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Create an app on Pinterest Developers', link: { label: 'Open Pinterest Developers', url: 'https://developers.pinterest.com/apps/' }, description: 'Requires a Pinterest Business account.' },
    { title: 'Add the Redirect URI' },
  ],
  envVarNames: ['PINTEREST_CLIENT_ID', 'PINTEREST_CLIENT_SECRET'],
};

const dribbble: PlatformAuthConfig = {
  identifier: 'dribbble',
  label: 'Dribbble',
  category: 'simple-oauth',
  developerPortalUrl: 'https://dribbble.com/account/applications',
  redirectUriPath: '/integrations/social/dribbble',
  fields: [
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Client ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Register an application on Dribbble', link: { label: 'Open Dribbble Apps', url: 'https://dribbble.com/account/applications' } },
    { title: 'Set the Redirect URI' },
  ],
  envVarNames: ['DRIBBLE_CLIENT_ID', 'DRIBBLE_CLIENT_SECRET'],
};

const discord: PlatformAuthConfig = {
  identifier: 'discord',
  label: 'Discord',
  category: 'oauth-plus-bot',
  developerPortalUrl: 'https://discord.com/developers/applications',
  redirectUriPath: '/integrations/social/discord',
  fields: [
    { key: 'clientId', label: 'Application ID (Client ID)', type: 'text', placeholder: 'Enter Application ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true, storageKey: 'clientSecret' },
    { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'Enter Bot Token', required: true, storageKey: 'additionalConfig', additionalConfigKey: 'botToken' },
  ],
  setupSteps: [
    { title: 'Create an application on the Discord Developer Portal', link: { label: 'Open Discord Developers', url: 'https://discord.com/developers/applications' } },
    { title: 'Add an App Icon (required by Discord, 1024x1024 max)' },
    { title: 'Go to OAuth2 and add the Redirect URI' },
    { title: 'Go to Bot, click "Reset Token", and copy the Bot Token' },
    { title: 'Invite the bot to your server with appropriate permissions' },
  ],
  envVarNames: ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_BOT_TOKEN_ID'],
};

const slack: PlatformAuthConfig = {
  identifier: 'slack',
  label: 'Slack',
  category: 'simple-oauth',
  developerPortalUrl: 'https://api.slack.com/apps',
  redirectUriPath: '/integrations/social/slack',
  fields: [
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Client ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Create a Slack App', link: { label: 'Open Slack API', url: 'https://api.slack.com/apps' } },
    { title: 'Go to OAuth & Permissions and add the Redirect URI' },
    { title: 'Add required Bot Token Scopes', checklist: ['chat:write', 'channels:read'] },
  ],
  envVarNames: ['SLACK_ID', 'SLACK_SECRET'],
};

const mastodon: PlatformAuthConfig = {
  identifier: 'mastodon',
  label: 'Mastodon',
  category: 'api-registration',
  developerPortalUrl: 'https://mastodon.social/settings/applications',
  redirectUriPath: '/integrations/social/mastodon',
  fields: [
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Client ID', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true, storageKey: 'clientSecret' },
    { key: 'instanceUrl', label: 'Instance URL', type: 'url', placeholder: 'https://mastodon.social', required: true, storageKey: 'additionalConfig', additionalConfigKey: 'instanceUrl' },
  ],
  setupSteps: [
    { title: 'Choose your Mastodon instance' },
    { title: 'Register an application via the API or instance settings', link: { label: 'Open mastodon.social apps', url: 'https://mastodon.social/settings/applications' }, description: 'Or use a curl command to register via the API.' },
    { title: 'Set the Redirect URI and required scopes', checklist: ['write:statuses', 'write:media', 'read:accounts'] },
    { title: 'Copy the Client ID, Client Secret, and your instance URL' },
  ],
  envVarNames: ['MASTODON_CLIENT_ID', 'MASTODON_CLIENT_SECRET', 'MASTODON_URL'],
};

const bluesky: PlatformAuthConfig = {
  identifier: 'bluesky',
  label: 'Bluesky',
  category: 'zero-config',
  developerPortalUrl: 'https://bsky.app/settings/app-passwords',
  redirectUriPath: '/integrations/social/bluesky',
  fields: [
    { key: 'clientId', label: 'Handle / Username', type: 'text', placeholder: 'yourname.bsky.social', required: true, storageKey: 'clientId' },
    { key: 'clientSecret', label: 'App Password', type: 'password', placeholder: 'Enter App Password', required: true, storageKey: 'clientSecret' },
  ],
  setupSteps: [
    { title: 'Go to Bluesky App Passwords', link: { label: 'Open Bluesky Settings', url: 'https://bsky.app/settings/app-passwords' } },
    { title: 'Create a new App Password and copy it' },
  ],
  envVarNames: [],
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const PLATFORM_AUTH_CONFIG: Record<string, PlatformAuthConfig> = {
  x,
  linkedin,
  'linkedin-page': linkedinPage,
  reddit,
  facebook,
  instagram,
  'instagram-standalone': instagramStandalone,
  threads,
  youtube,
  tiktok,
  pinterest,
  dribbble,
  discord,
  slack,
  mastodon,
  bluesky,
};

/** Ordered list for UI rendering */
export const PLATFORM_AUTH_LIST: PlatformAuthConfig[] = [
  x, linkedin, linkedinPage, reddit,
  instagram, instagramStandalone, facebook, threads,
  youtube, tiktok, pinterest, dribbble,
  discord, slack, mastodon, bluesky,
];

/**
 * Get config for a platform, falling back to a generic config
 * so unknown platforms still get a usable form.
 */
export function getPlatformConfig(identifier: string): PlatformAuthConfig {
  return PLATFORM_AUTH_CONFIG[identifier] ?? {
    identifier,
    label: identifier,
    category: 'simple-oauth' as AuthCategory,
    developerPortalUrl: '',
    redirectUriPath: `/integrations/social/${identifier}`,
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Client ID', required: true, storageKey: 'clientId' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true, storageKey: 'clientSecret' },
    ],
    setupSteps: [],
    envVarNames: [],
  };
}
