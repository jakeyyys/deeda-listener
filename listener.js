console.log("🔥 DeeDa EXTERNAL listener loaded via jsDelivr");

window.addEventListener("message", function(event) {
  if (!event.origin || !event.origin.includes("deeda.care")) return;

  console.log("🔥 DeeDa MESSAGE RECEIVED:", event.data);

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "deeda_event",
    deeda_event_name: event.data.event || null,
    deeda_event_type: event.data.type || null,
    deeda_payload: event.data.extInfo || {},
    widgetNo: event.data.widgetNo || null,
    timestamp: Date.now()
  });

  console.log("🔥 dataLayer PUSHED:", {
    deeda_event_name: event.data.event,
    deeda_event_type: event.data.type
  });
});
