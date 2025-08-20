import express, { json } from 'express';

const app = express();
app.use(json());

// Health Endpoint
app.get('/health', (_, res) => {
  res.send('OK');
});

// Start listening
// eslint-disable-next-line no-process-env
const server = app.listen(process.env.PORT || 8000);

// Export a method to close the server
export default async () => {
  server.close();
};
