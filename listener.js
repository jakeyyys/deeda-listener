console.log("⛑️🔥 DeeDa EXTERNAL listener loaded");

// -----------------------------
// Debug helper (safe to keep)
// -----------------------------
window._deeda_debug = { fbq_calls: [] };

// -----------------------------
// Helper: Safe Meta trigger
// -----------------------------
function safeFbq(eventName, payload) {
  if (!window._deeda_debug) window._deeda_debug = { fbq_calls: [] };

  window._deeda_debug.fbq_calls.push({
    eventName,
    payload,
    ts: Date.now()
  });

  function tryFire() {
    if (typeof fbq !== "function") {
      console.log("⛑️⚠️ fbq not ready, retrying...");
      setTimeout(tryFire, 300);
      return;
    }

    console.log("⛑️🔥 FB EVENT FIRED:", eventName, payload);
    fbq("track", eventName, payload || {});
  }

  tryFire();
}

// -----------------------------
// Helper: GA4 tracking
// -----------------------------
function fireGA4(eventName, params) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params
  });

  console.log("⛑️📊 GA4 EVENT:", eventName, params);
}

// -----------------------------
// MAIN LISTENER
// -----------------------------
window.addEventListener("message", function (event) {
  if (!event.origin || !event.origin.includes("deeda.care")) return;

  console.log("⛑️🔥 DeeDa MESSAGE", event.data);

  const name = event.data.event;
  const type = event.data.type;
  const payload = event.data.extInfo || {};
  const widgetNo = event.data.widgetNo || null;
  const widgetType = event.data.widgetType || null;

  // -----------------------------
  // GA4: full fidelity tracking
  // -----------------------------
  fireGA4("deeda_event", {
    deeda_event_name: name,
    deeda_event_type: type,
    deeda_payload: payload,
    widgetNo: widgetNo,
    widgetType: widgetType,
    timestamp: Date.now()
  });

  // -----------------------------
  // META: INITIATE CHECKOUT
  // (embed only, intent signal)
  // -----------------------------
  if (name === "enter_personal" && widgetType === "embed") {
    safeFbq("InitiateCheckout", {
      source: "deeda",
      widgetType: "embed"
    });
  }

  // -----------------------------
  // META: PURCHASE
  // (embed only, conversion)
  // -----------------------------
  if (name === "complete" && widgetType === "embed") {
    safeFbq("Purchase", {
      value: payload.amount || 0,
      currency: payload.currency || "SGD",
      transaction_id: payload.transactionId || ""
    });
  }
});
