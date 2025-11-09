// node_modules/@vant/touch-emulator/dist/index.mjs
(function() {
  if (typeof window === "undefined") {
    return;
  }
  var eventTarget;
  var supportTouch = "ontouchstart" in window;
  if (!document.createTouch) {
    document.createTouch = function(view, target, identifier, pageX, pageY, screenX, screenY) {
      return new Touch(
        target,
        identifier,
        {
          pageX,
          pageY,
          screenX,
          screenY,
          clientX: pageX - window.pageXOffset,
          clientY: pageY - window.pageYOffset
        },
        0,
        0
      );
    };
  }
  if (!document.createTouchList) {
    document.createTouchList = function() {
      var touchList = TouchList();
      for (var i = 0; i < arguments.length; i++) {
        touchList[i] = arguments[i];
      }
      touchList.length = arguments.length;
      return touchList;
    };
  }
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;
      do {
        if (el.matches(s))
          return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }
  var Touch = function Touch2(target, identifier, pos, deltaX, deltaY) {
    deltaX = deltaX || 0;
    deltaY = deltaY || 0;
    this.identifier = identifier;
    this.target = target;
    this.clientX = pos.clientX + deltaX;
    this.clientY = pos.clientY + deltaY;
    this.screenX = pos.screenX + deltaX;
    this.screenY = pos.screenY + deltaY;
    this.pageX = pos.pageX + deltaX;
    this.pageY = pos.pageY + deltaY;
  };
  function TouchList() {
    var touchList = [];
    touchList["item"] = function(index) {
      return this[index] || null;
    };
    touchList["identifiedTouch"] = function(id) {
      return this[id + 1] || null;
    };
    return touchList;
  }
  var initiated = false;
  function onMouse(touchType) {
    return function(ev) {
      if (ev.type === "mousedown") {
        initiated = true;
      }
      if (ev.type === "mouseup") {
        initiated = false;
      }
      if (ev.type === "mousemove" && !initiated) {
        return;
      }
      if (ev.type === "mousedown" || !eventTarget || eventTarget && !eventTarget.dispatchEvent) {
        eventTarget = ev.target;
      }
      if (eventTarget.closest("[data-no-touch-simulate]") == null) {
        triggerTouch(touchType, ev);
      }
      if (ev.type === "mouseup") {
        eventTarget = null;
      }
    };
  }
  function triggerTouch(eventName, mouseEv) {
    var touchEvent = document.createEvent("Event");
    touchEvent.initEvent(eventName, true, true);
    touchEvent.altKey = mouseEv.altKey;
    touchEvent.ctrlKey = mouseEv.ctrlKey;
    touchEvent.metaKey = mouseEv.metaKey;
    touchEvent.shiftKey = mouseEv.shiftKey;
    touchEvent.touches = getActiveTouches(mouseEv);
    touchEvent.targetTouches = getActiveTouches(mouseEv);
    touchEvent.changedTouches = createTouchList(mouseEv);
    eventTarget.dispatchEvent(touchEvent);
  }
  function createTouchList(mouseEv) {
    var touchList = TouchList();
    touchList.push(new Touch(eventTarget, 1, mouseEv, 0, 0));
    return touchList;
  }
  function getActiveTouches(mouseEv) {
    if (mouseEv.type === "mouseup") {
      return TouchList();
    }
    return createTouchList(mouseEv);
  }
  function TouchEmulator() {
    window.addEventListener("mousedown", onMouse("touchstart"), true);
    window.addEventListener("mousemove", onMouse("touchmove"), true);
    window.addEventListener("mouseup", onMouse("touchend"), true);
  }
  TouchEmulator["multiTouchOffset"] = 75;
  if (!supportTouch) {
    new TouchEmulator();
  }
})();
//# sourceMappingURL=@vant_touch-emulator.js.map
