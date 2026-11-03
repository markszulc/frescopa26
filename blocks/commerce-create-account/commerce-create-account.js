import { SignUp } from '@dropins/storefront-auth/containers/SignUp.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import {
  CUSTOMER_LOGIN_PATH,
  checkIsAuthenticated,
  authPrivacyPolicyConsentSlot,
} from '../../scripts/commerce.js';
import {
  buildAuthCard, getReturnPath, syncAriaInvalid, withReturnUrl,
} from '../commerce-login/commerce-login.js';

// Initialize
import '../../scripts/initializers/auth.js';

export default async function decorate(block) {
  if (checkIsAuthenticated()) {
    window.location.href = getReturnPath();
  } else {
    const formContainer = buildAuthCard(block);
    syncAriaInvalid(block);
    await authRenderer.render(SignUp, {
      requireRetypePassword: true,
      hideCloseBtnOnEmailConfirmation: true,
      routeSignIn: () => withReturnUrl(CUSTOMER_LOGIN_PATH),
      routeRedirectOnSignIn: () => getReturnPath(),
      slots: {
        ...authPrivacyPolicyConsentSlot,
      },
    })(formContainer);
  }
}
