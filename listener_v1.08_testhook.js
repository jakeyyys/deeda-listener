console.log("⛑️🔥 DeeDa EXTERNAL listener loaded");

// =====================================================
// CONFIG (change only these later)
// =====================================================
const META_PRIMARY_STANDARD_EVENT = "Purchase"; // future: "Donate"
const META_SHADOW_CUSTOM_EVENT = "Donate";      // shadow tracking
const TRACK_WIDGET = true; // set false if widget events should be ignored

// =====================================================
// Debug helper (safe to keep)
// =====================================================
window._deeda_debug = { fbq_calls: [] };

// =====================================================
// Helper: Safe Meta STANDARD trigger
// =====================================================
function safeFbqStandard(eventName, payload) {
  window._deeda_debug.fbq_calls.push({
    type: "standard",
    eventName,
    payload,
    ts: Date.now()
  });

  function tryFire() {
    if (typeof fbq !== "function") {
      console.log("⛑️⚠️ fbq not ready (standard), retrying...");
      setTimeout(tryFire, 300);
      return;
    }

    console.log("⛑️🔥 META STANDARD FIRED:", eventName, payload);
    fbq("track", eventName, payload || {});
  }

  tryFire();
}

// =====================================================
// Helper: Safe Meta CUSTOM trigger
// =====================================================
function safeFbqCustom(eventName, payload) {
  window._deeda_debug.fbq_calls.push({
    type: "custom",
    eventName,
    payload,
    ts: Date.now()
  });

  function tryFire() {
    if (typeof fbq !== "function") {
      console.log("⛑️⚠️ fbq not ready (custom), retrying...");
      setTimeout(tryFire, 300);
      return;
    }

    console.log("⛑️🔥 META CUSTOM FIRED:", eventName, payload);
    fbq("trackCustom", eventName, payload || {});
  }

  tryFire();
}

// =====================================================
// Helper: GA4 tracking
// =====================================================
function fireGA4(eventName, params) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params
  });

  console.log("⛑️📊 GA4 EVENT:", eventName, params);
}

// =====================================================
// MAIN DeeDa LISTENER
// =====================================================
window.addEventListener("message", function (event) {
  if (!event.origin || !event.origin.includes("deeda.care")) return;
  if (!event.data) return;

  console.log("⛑️🔥 DeeDa MESSAGE RECEIVED:", event.data);

  const name = event.data.event;
  const type = event.data.type;
  const payload = event.data.extInfo || {};
  const widgetNo = event.data.widgetNo || null;
  const widgetType = event.data.widgetType || null;

  const isEmbed = widgetType === "embed";
  const isWidget = widgetType === "widget";
  const isDeedaSurface = isEmbed || (TRACK_WIDGET && isWidget);

  if (!isDeedaSurface) {
    console.log("⛑️⚠️ DeeDa event ignored (surface filtered)");
    return;
  }

  // --------------------------------------------------
  // GA4 — full-fidelity logging (always)
  // --------------------------------------------------
  fireGA4("deeda_event", {
    deeda_event_name: name,
    deeda_event_type: type,
    widgetType,
    widgetNo,
    value: payload.amount || null,
    currency: payload.currency || "SGD",
    transaction_id: payload.transactionId || null,
    timestamp: Date.now()
  });

  // --------------------------------------------------
  // META — InitiateCheckout (intent)
  // embed + widget
  // --------------------------------------------------
  if (name === "enter_personal") {
    safeFbqStandard("InitiateCheckout", {
      source: "deeda",
      widgetType: widgetType
    });
  }

  // --------------------------------------------------
  // META — Conversion (completion)
  // embed + widget
  // --------------------------------------------------
  if (name === "complete") {
    const conversionPayload = {
      value: payload.amount || 0,
      currency: payload.currency || "SGD",
      transaction_id: payload.transactionId || "",
      widgetType: widgetType
    };

    // PRIMARY optimisation event (STANDARD)
    safeFbqStandard(META_PRIMARY_STANDARD_EVENT, conversionPayload);

    // SHADOW tracking event (CUSTOM ONLY)
    safeFbqCustom(META_SHADOW_CUSTOM_EVENT, conversionPayload);
  }
});

// =====================================================
// ⛑️ TEST HOOK — manual only (remove after verification)
// =====================================================
window._deeda_testPurchase = function () {
  console.log("⛑️🧪 MANUAL TEST: Purchase + Donate firing");

  const testPayload = {
    value: 1,
    currency: "SGD",
    transaction_id: "TEST_" + Date.now(),
    widgetType: "test"
  };

  // Simulate real conversion path
  safeFbqStandard(META_PRIMARY_STANDARD_EVENT, testPayload);
  safeFbqCustom(META_SHADOW_CUSTOM_EVENT, testPayload);
};
