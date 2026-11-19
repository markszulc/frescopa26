import { SignIn } from '@dropins/storefront-auth/containers/SignIn.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import { checkIsAuthenticated } from '../../scripts/commerce.js';
import {
  buildAuthCard, getReturnPath, stabilizePasswordInput, syncAriaInvalid,
} from '../commerce-login/commerce-login.js';

// Initialize
import '../../scripts/initializers/auth.js';

/**
 * Target of the account confirmation email: /customer/confirm-account?email=…&key=…
 * The SignIn container reads `email` and `key`, confirms the account, then
 * shows the sign-in form.
 */
export default async function decorate(block) {
  if (checkIsAuthenticated()) {
    window.location.href = getReturnPath();
  } else {
    const formContainer = buildAuthCard(block);
    syncAriaInvalid(block);
    stabilizePasswordInput(block);
    await authRenderer.render(SignIn, {
      enableEmailConfirmation: true,
      renderSignUpLink: false,
      routeRedirectOnSignIn: () => getReturnPath(),
    })(formContainer);
  }
}
