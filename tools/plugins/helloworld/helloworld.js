import { LitElement, html } from 'da-lit';
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import {
  loadProgress,
  saveProgress,
  clearProgress,
  getNextActiveStep,
  isComplete,
  parseWelcomeBlock,
} from './utils.js';
import startPolling from './poll.js';

const CONTENT_URL = 'https://adobe--sendto--aemcoder.aem.page/adobe/onboarding/';

class WelcomeApp extends LitElement {
  static properties = {
    loading: { state: true },
    welcome: { state: true },
    steps: { state: true },
    showWelcome: { state: true },
    activeStep: { state: true },
    completedSteps: { state: true },
    done: { state: true },
    pageReady: { state: true },
    siteUrl: { state: true },
    hasJob: { state: true },
  };

  constructor() {
    super();
    this.loading = true;
    this.welcome = null;
    this.steps = [];
    this.showWelcome = true;
    this.activeStep = 0;
    this.completedSteps = new Set();
    this.done = false;
    this.pageReady = false;
    this.siteUrl = '';
    this.hasJob = false;
    this.actions = null;
  }

  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this.loadContent();
    DA_SDK.then(({ actions }) => { this.actions = actions; });
    startPolling((siteUrl) => {
      this.siteUrl = siteUrl;
      this.pageReady = true;
    }).then((started) => { this.hasJob = started; });
  }

  async loadContent() {
    try {
      const resp = await fetch(CONTENT_URL);
      const text = await resp.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const block = doc.querySelector('.welcome');
      if (block) {
        const { welcome, steps } = parseWelcomeBlock(block);
        this.welcome = welcome;
        this.steps = steps;
      }
    } catch {
      // Fetch failed — steps remain empty
    }

    const saved = loadProgress(window.location.href);
    if (saved) {
      this.completedSteps = saved.completedSteps;
      this.activeStep = saved.activeStep;
      this.done = isComplete(this.completedSteps, this.steps.length);
      if (saved.completedSteps.size > 0) this.showWelcome = false;
    }

    this.loading = false;
  }

  executeStepAction(step) {
    const action = step?.action || '';
    if (!action || action === 'scroll-to') return;

    const match = action.match(/^open-chat\("(.*)"\)$/s);
    if (match) {
      const prompt = match[1];
      window.parent.postMessage({ type: 'nx-open-chat' }, '*');
      if (this.actions?.setPrompt) {
        this.actions.setPrompt(prompt, { autoSend: false });
      }
    }
  }

  onStartTour() {
    this.showWelcome = false;
    this.executeStepAction(this.steps[this.activeStep]);
  }

  onMarkComplete() {
    const next = new Set(this.completedSteps);
    next.add(this.activeStep);
    if (isComplete(next, this.steps.length)) {
      this.completedSteps = next;
      this.done = true;
      saveProgress(window.location.href, next, this.activeStep);
      return;
    }
    const nextStep = getNextActiveStep(next, this.activeStep, this.steps.length);
    this.completedSteps = next;
    this.activeStep = nextStep;
    saveProgress(window.location.href, next, nextStep);
    this.executeStepAction(this.steps[nextStep]);
  }

  onNavigateToStep(index) {
    this.activeStep = index;
    this.showWelcome = false;
    this.executeStepAction(this.steps[index]);
  }

  onStartOver() {
    clearProgress(window.location.href);
    this.completedSteps = new Set();
    this.activeStep = 0;
    this.done = false;
    this.showWelcome = true;
  }

  static renderLoading() {
    return html`
      <div class="ob-panel">
        <div class="ob-hero">
          <div class="ob-loading"><div class="ob-spinner"></div></div>
        </div>
      </div>`;
  }

  renderWelcome() {
    const { title, description, ctaText } = this.welcome || {};
    return html`
      <h1 class="ob-hero-title">${title}</h1>
      <p class="ob-hero-desc">${description}</p>
      <button class="ob-cta-btn" @click=${() => this.onStartTour()}>
        ${ctaText || 'Get Started'}
      </button>`;
  }

  renderStepDots() {
    return html`
      <div class="ob-step-dots">
        ${this.steps.map((_, i) => html`
          <span class="ob-step-dot${i === this.activeStep ? ' active' : ''}"></span>
        `)}
      </div>`;
  }

  renderStepCard() {
    const step = this.steps[this.activeStep];
    if (!step) return html``;
    const isAlreadyDone = this.completedSteps.has(this.activeStep);
    return html`
      <h2 class="ob-step-title">${step.title}</h2>
      <p class="ob-step-desc">${step.description}</p>
      <button
        class="ob-cta-btn"
        ?disabled=${isAlreadyDone}
        @click=${() => this.onMarkComplete()}
      >
        ${isAlreadyDone ? 'Completed ✓' : 'Next →'}
      </button>`;
  }

  renderLessonsList() {
    return html`
      ${!this.done ? html`
      <div class="ob-lessons-card">
        <p class="ob-lessons-label">All lessons</p>
        <ul class="ob-lessons-list">
          ${this.steps.map((step, i) => {
    const completed = this.completedSteps.has(i);
    const active = !this.showWelcome && this.activeStep === i;
    const cls = `ob-lesson-row${active ? ' active' : ''}${completed ? ' completed' : ''}`;
    const badge = completed ? '✓' : String(i + 1);
    return html`
              <li class=${cls} @click=${() => this.onNavigateToStep(i)}>
                <span class="ob-lesson-badge">${badge}</span>
                <span class="ob-lesson-title">${step.title}</span>
              </li>`;
  })}
        </ul>
      </div>` : ''}
      ${this.hasJob ? html`<div class="ob-page-status">
        ${this.pageReady ? html`
          <div class="ob-page-status-row">
            <p class="ob-page-status-title">Your page is ready.</p>
            <a class="ob-page-ready-btn" href=${this.siteUrl} target="top">Open your page</a>
          </div>
          <p class="ob-page-status-desc">Your page is live in Experience Workspace.</p>
          <div class="ob-page-progress-track">
            <div class="ob-page-progress-fill ob-page-progress-complete"></div>
          </div>
        ` : html`
          <p class="ob-page-status-title">Your page is on its way.</p>
          <p class="ob-page-status-desc">Follow the lessons while your page loads.</p>
          <div class="ob-page-progress-track">
            <div class="ob-page-progress-fill"></div>
          </div>
        `}
      </div>` : ''}`;
  }

  renderPageReady() {
    return html`
      <div class="ob-ready-check">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
          <path d="M20 32l9 9 15-18" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 class="ob-hero-title">You're ready to edit.</h1>
      <p class="ob-hero-desc">Your page has been imported. Everything you learned is live. Open your page and start editing.</p>
      <a class="ob-cta-btn" href=${this.siteUrl} target="top">Open your page</a>`;
  }

  renderCompletion() {
    return html`
      <div class="ob-ready-check">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
          <path d="M20 32l9 9 15-18" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 class="ob-hero-title">You're all done!</h1>
      <p class="ob-hero-desc">
        You've completed all ${this.steps.length} lessons. You're ready to make this site your own.
      </p>
      <button class="ob-cta-btn" @click=${() => this.onStartOver()}>
        Start over
      </button>`;
  }

  render() {
    if (this.loading) return WelcomeApp.renderLoading();

    const showDots = !this.showWelcome && !this.done;
    let heroContent;
    if (this.done && this.pageReady) heroContent = this.renderPageReady();
    else if (this.done) heroContent = this.renderCompletion();
    else if (this.showWelcome) heroContent = this.renderWelcome();
    else heroContent = this.renderStepCard();

    return html`
      <div class="ob-panel">
        <div class="ob-hero">
          ${showDots ? this.renderStepDots() : ''}
          ${heroContent}
        </div>
        <div class="ob-bottom-card">${this.renderLessonsList()}</div>
      </div>`;
  }
}

customElements.define('welcome-app', WelcomeApp);
