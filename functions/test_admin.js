const admin = require('firebase-admin');

try {
  admin.initializeApp();
  console.log("App initialized successfully. Project ID:", admin.app().options.projectId);
} catch (e) {
  console.error("Failed to initialize:", e.message);
}
