import { handler } from '../src/index.mjs';

// Test event similaire à celui que vous utilisez
const testPatchEvent = {
  "version": "2.0",
  "routeKey": "PATCH /exercise-weights/{weightId}",
  "rawPath": "/exercise-weights/68f0a194f8d5912bca1e772e",
  "headers": {
    "content-type": "application/json"
  },
  "requestContext": {
    "http": {
      "method": "PATCH",
      "path": "/exercise-weights/68f0a194f8d5912bca1e772e"
    }
  },
  "pathParameters": {
    "weightId": "68f0a194f8d5912bca1e772e"
  },
  "body": "{\"weight\":82.5,\"reps\":10}",
  "isBase64Encoded": false
};

console.log('🧪 Test PATCH exercise-weight...');
console.log('Event:', JSON.stringify(testPatchEvent, null, 2));

try {
  const result = await handler(testPatchEvent);
  console.log('✅ Result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ Error:', error);
}