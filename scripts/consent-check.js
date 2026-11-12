let consentedLoaded = false;

/**
 * Dummy consent implementation.
 *
 * By default consent is declined, so consented scripts (analytics, martech, etc.)
 * are not loaded. This stands in for a real CMP (OneTrust, etc.) and can be
 * swapped out later.
 *
 * The default can be overridden with a query parameter for testing. The choice
 * is persisted in localStorage so it survives page transitions:
 *   ?consent=accept   grant consent (loads consented.js)
 *   ?consent=decline  decline consent (default behavior)
 *
 * @returns {boolean} true if the user has consented
 */
function hasConsent() {
  const consent = new URLSearchParams(window.location.search).get('consent');
  if (consent !== null) {
    const granted = ['accept', 'true', '1', 'yes'].includes(consent.toLowerCase());
    try {
      localStorage.setItem('consent', granted ? 'accept' : 'decline');
    } catch (e) {
      // storage unavailable, fall back to this page only
    }
    return granted;
  }
  try {
    return localStorage.getItem('consent') === 'accept';
  } catch (e) {
    // default: decline
    return false;
  }
}

/**
 * Loads consented scripts once consent is available.
 */
function loadConsented() {
  if (consentedLoaded) return;
  consentedLoaded = true;
  import('./consented.js');
}

/**
 * Notifies listeners of the current consent state and loads consented
 * scripts if consent has been granted.
 */
function onConsentUpdate() {
  const consented = hasConsent();
  window.dispatchEvent(new CustomEvent('consent.update', { detail: { consented } }));
  if (consented) {
    loadConsented();
  }
}

onConsentUpdate();
