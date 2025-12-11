console.log("🔥 DeeDa EXTERNAL listener loaded");
window._deeda_debug = { fbq_calls: [] };

// --- Helper: Safe fbq trigger ---
function safeFbq(eventName, payload) {
  if (!window._deeda_debug) window._deeda_debug = { fbq_calls: [] };
  window._deeda_debug.fbq_calls.push({ eventName, payload, ts: Date.now() });

  function tryFire() {
    if (typeof fbq !== "function") {
      console.log("⚠️ fbq not ready, retrying...");
      setTimeout(tryFire, 300);
      return;
    }

    console.log("🔥 FB EVENT FIRED:", eventName, payload);
    fbq("track", eventName, payload || {});
  }

  tryFire();
}

// --- Helper: GA4 tracking ---
function fireGA4(eventName, params) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params
  });
  console.log("📊 GA4 EVENT:", eventName, params);
}

// --- MAIN LISTENER ---
window.addEventListener("message", function(event) {
  if (!event.origin.includes("deeda.care")) return;

  console.log("🔥 DeeDa MESSAGE:", event.data);

  const name = event.data.event;
  const type = event.data.type;
  const payload = event.data.extInfo || {};
  const widget = event.data.widgetNo;

  fireGA4("deeda_event", {
    deeda_event_name: name,
    deeda_event_type: type,
    deeda_payload: payload,
    widgetNo: widget,
    timestamp: Date.now()
  });

  // 1️⃣ INITIATE CHECKOUT
  if (name === "enter_personal") {
    safeFbq("InitiateCheckout", {
      step: name,
      widgetNo: widget
    });
  }

  // 2️⃣ PURCHASE EVENT
  if (name === "payment_success") {
    safeFbq("Purchase", {
      value: payload.amount || 0,
      currency: payload.currency || "SGD",
      transaction_id: payload.transactionId || ""
    });
  }
});
