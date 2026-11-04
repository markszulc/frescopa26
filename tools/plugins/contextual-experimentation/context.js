export const MFE_ORIGIN = 'https://experience.adobe.com';

export function getPageContext(context) {
  const {
    org, repo, site = repo, branch, path = '/',
  } = context;
  if (![org, site, branch].every((part) => typeof part === 'string'
    && /^[a-z0-9-]+$/.test(part))) {
    throw new Error('DA has not resolved this site and its code branch. Reopen the panel.');
  }
  const origin = `https://${branch}--${site}--${org}.preview.da.live`;
  const page = new URL(`/${path.replace(/^\/+/, '')}`, origin);
  page.search = '';
  page.hash = '';
  return {
    org, site, origin, pageUrl: page.href,
  };
}

export function getEditorHash(href, context) {
  const url = new URL(href, context.origin);
  if (url.origin !== context.origin || url.username || url.password) {
    throw new Error('The MFE requested navigation outside this DA site.');
  }
  const path = url.pathname.replace(/\.html$/, '').replace(/^\/+|\/+$/g, '') || 'index';
  return `/${context.org}/${context.site}/${path}`;
}

export function getMfeUrl({
  pageUrl, origin, token, imsOrg,
}) {
  if (!token || !/^[a-z0-9]+@AdobeOrg$/i.test(imsOrg)) {
    throw new Error('Sign in to DA and supply a valid Adobe IMS organization ID.');
  }
  const url = new URL(
    '/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/ue.html',
    MFE_ORIGIN,
  );
  const data = {
    triggerSource: 'ue',
    env: 'prod',
    origin,
    pageUrl,
    imsToken: token,
    imsOrg,
    colorScheme: 'light',
    locale: 'en-US',
  };
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  url.hash = `ue-data=${encodeURIComponent(btoa(String.fromCharCode(...bytes)))}`;
  return url.href;
}

export function isMfeMessage(event, frame) {
  return event.origin === MFE_ORIGIN && event.source === frame.contentWindow
    && event.data?.source === 'AEMExperimentation';
}
