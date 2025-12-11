console.log("🔥 DeeDa EXTERNAL listener loaded");

// --- Helper: Safe fbq trigger ---
function safeFbq(eventName, payload) {
  function tryFire() {
    if (typeof fbq !== "function") {
      console.log("⚠ fbq not ready, retrying...");
      setTimeout(tryFire, 300);
      return;
    }
    console.log("🔥 FB EVENT FIRED:", eventName, payload);
    fbq("track", eventName, payload || {});
  }
  tryFire();
}

// --- Helper: GA4 tracking (if GTM is allowed to push dataLayer) ---
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

  // Always push into dataLayer (GA4 compatible)
  fireGA4("deeda_event", {
    deeda_event_name: name,
    deeda_event_type: type,
    deeda_payload: payload,
    widgetNo: widget,
    timestamp: Date.now()
  });

  // --- EVENT ROUTING ---

  // 1️⃣ User starts filling in personal info → INITIATE CHECKOUT
  if (name === "enter_personal") {
    safeFbq("InitiateCheckout", {
      step: name,
      widgetNo: widget
    });
  }

  // 2️⃣ User selects an amount → DONATION INTENT (AddToCart)
  if (name === "select_amount") {
    safeFbq("AddToCart", {
      step: name,
      amount: payload.amount || null,
      currency: payload.currency || "SGD"
    });
  }

  // 3️⃣ Final donation is successful → PURCHASE
  if (name === "payment_success") {
    safeFbq("Purchase", {
      value: payload.amount || 0,
      currency: payload.currency || "SGD",
      transaction_id: payload.transactionId || ""
    });
  }
});
