/** Loading feedback for the main landscape; overlay videos have their own status. */
class LandscapePlayback {
  constructor() {
    this.panel = document.querySelector('#video-loading');
    this.message = document.querySelector('#video-loading-message');
    this.button = document.querySelector('#video-loading-action');
    this.button.addEventListener('click', () => this.action?.());
  }

  show(message, label, action) {
    this.panel.hidden = false;
    this.message.textContent = message;
    this.button.hidden = !label;
    this.button.textContent = label || '';
    this.action = action;
    this.panel.classList.toggle('is-actionable', Boolean(label));
  }

  hide() {
    clearTimeout(this.slowTimer);
    clearTimeout(this.failureTimer);
    this.panel.hidden = true;
    this.action = null;
  }

  async prepare(video, retry) {
    this.cancel?.();
    this.unwatch?.();
    this.hide();
    this.show('Loading landscape…');
    return new Promise((resolve) => {
      let finished = false;
      const cleanup = () => {
        clearTimeout(this.slowTimer);
        clearTimeout(this.failureTimer);
        video.removeEventListener('playing', ready);
        video.removeEventListener('error', failed);
      };
      this.cancel = () => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve(false);
      };
      const ready = () => {
        if (finished) return;
        finished = true;
        cleanup();
        this.hide();
        const resume = () => this.prepare(video, resume);
        this.watch(video, resume);
        resolve(true);
      };
      const failed = () => {
        if (finished) return;
        finished = true;
        cleanup();
        video.pause();
        this.show('The landscape could not load. Please try again.', 'Retry', () => {
          video.load();
          retry();
        });
        resolve(false);
      };
      const play = () => {
        this.show('Loading landscape…');
        clearTimeout(this.slowTimer);
        clearTimeout(this.failureTimer);
        this.slowTimer = setTimeout(() => this.show('Still loading… This may take a moment.'), 8000);
        this.failureTimer = setTimeout(failed, 45000);
        video.play().then(ready).catch((error) => {
          if (finished) return;
          if (error.name === 'NotAllowedError') {
            clearTimeout(this.slowTimer);
            clearTimeout(this.failureTimer);
            this.show('Your landscape is ready to play.', 'Click to play', play);
          } else {
            failed();
          }
        });
      };
      video.addEventListener('playing', ready);
      video.addEventListener('error', failed);
      play();
    });
  }

  watch(video, retry) {
    const waiting = () => {
      this.show('Loading landscape…');
      clearTimeout(this.slowTimer);
      this.slowTimer = setTimeout(() => this.show('Still loading… This may take a moment.', 'Retry', () => {
        video.load();
        retry();
      }), 8000);
    };
    const playing = () => this.hide();
    const error = () => {
      clearTimeout(this.slowTimer);
      this.show('The landscape could not load. Please try again.', 'Retry', () => {
        video.load();
        retry();
      });
    };
    video.addEventListener('waiting', waiting);
    video.addEventListener('playing', playing);
    video.addEventListener('error', error);
    this.unwatch = () => {
      video.removeEventListener('waiting', waiting);
      video.removeEventListener('playing', playing);
      video.removeEventListener('error', error);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.landscapePlayback = new LandscapePlayback();
});
