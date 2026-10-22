import raf from './raf.js';

describe('The raf utility function', () => {
  it('Throttles function calls that arrive in quick succession using Request Animation Frame', () => {
    const unthrottledFunction = jasmine.createSpy('unthrottledFunction');
    const throttledCallback = jasmine.createSpy('throttledCallback');
    const throttledFunction = raf(throttledCallback);

    for (let i = 0; i < 10; i++) {
      unthrottledFunction();
      throttledFunction();
    }

    return new Promise((resolve) => {
      requestAnimationFrame(resolve);
    }).then(() => {
      expect(unthrottledFunction).toHaveBeenCalledTimes(10);
      expect(throttledCallback).toHaveBeenCalledTimes(1);
    });
  });
  it('Only invokes callback once per animation frame', () => {
    const throttledCallback = jasmine.createSpy('throttledCallback');
    const throttledFunction = raf(throttledCallback);

    for (let i = 0; i < 10; i++) {
      throttledFunction();
    }

    return new Promise((resolve) => {
      requestAnimationFrame(resolve);
    })
      .then(() => {
        return new Promise((resolve) => {
          requestAnimationFrame(resolve);
        });
      })
      .then(() => {
        expect(throttledCallback).toHaveBeenCalledTimes(1);
      });
  });
  it('Invokes callback again if called in subsequent animation frame', () => {
    const throttledCallback = jasmine.createSpy('throttledCallback');
    const throttledFunction = raf(throttledCallback);

    for (let i = 0; i < 10; i++) {
      throttledFunction();
    }

    return new Promise((resolve) => {
      requestAnimationFrame(resolve);
    })
      .then(() => {
        for (let i = 0; i < 10; i++) {
          throttledFunction();
        }

        return new Promise((resolve) => {
          requestAnimationFrame(resolve);
        });
      })
      .then(() => {
        expect(throttledCallback).toHaveBeenCalledTimes(2);
      });
  });
  it('Allows later calls if the callback throws', () => {
    const animationFrames = [];
    const callback = jasmine.createSpy('callback').and.callFake(() => {
      if (callback.calls.count() === 1) {
        throw new Error('render failed');
      }
    });
    const throttledFunction = raf(callback);
    spyOn(window, 'requestAnimationFrame').and.callFake((animationFrame) => {
      animationFrames.push(animationFrame);
    });

    throttledFunction();
    expect(() => animationFrames.shift()()).toThrowError('render failed');

    throttledFunction();

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2);
    const nextAnimationFrame = animationFrames.shift();
    expect(nextAnimationFrame).toEqual(jasmine.any(Function));
    if (nextAnimationFrame) {
      nextAnimationFrame();
    }
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
