console.log("🔥 DeeDa EXTERNAL listener loaded via jsDelivr");

// --- Helper: Safe fbq trigger ---
function fireFbq(eventName, payload) {
  // Retry until pixel loads
  function tryFire() {
    if (typeof fbq !== "function") {
      console.log("⚠️ fbq not ready, retrying...");
      setTimeout(tryFire, 300);
      return;
    }

    console.log("🔥 FB EVENT SENT:", eventName, payload);
    fbq("track", eventName, payload || {});
  }

  tryFire();
}

// --- Main listener ---
window.addEventListener("message", function(event) {
  if (!event.origin || !event.origin.includes("deeda.care")) return;

  console.log("🔥 DeeDa MESSAGE RECEIVED:", event.data);

  var name = event.data.event || null;
  var type = event.data.type || null;
  var payload = event.data.extInfo || {};
  var widget = event.data.widgetNo || null;

  // --- Push to dataLayer for GA4 ---
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "deeda_event",
    deeda_event_name: name,
    deeda_event_type: type,
    deeda_payload: payload,
    widgetNo: widget,
    timestamp: Date.now()
  });

  console.log("🔥 dataLayer PUSHED:", {
    deeda_event_name: name,
    deeda_event_type: type
  });

  // --- FIRE META CONVERSION EVENTS RIGHT HERE ---
  // INITIATE CHECKOUT
  if (name === "enter_personal") {
    fireFbq("InitiateCheckout", {
      step: name,
      widgetNo: widget
    });
  }

  // ADD TO CART / DONATION INTENT
  if (name === "select_amount") {
    fireFbq("AddToCart", {
      step: name,
      amount: payload.amount || null,
      currency: payload.currency || "SGD"
    });
  }

  // FINAL PURCHASE / DONATION SUCCESS
  if (name === "payment_success") {
    fireFbq("Purchase", {
      value: payload.amount || 0,
      currency: payload.currency || "SGD",
      transaction_id: payload.transactionId || ""
    });
  }
});
