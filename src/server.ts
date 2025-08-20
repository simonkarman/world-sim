import express from 'express';

const app = express();

app.get('/health', (_, res) => {
  res.send('OK');
});

// Start listening and export a method to close the server
// eslint-disable-next-line no-process-env
const server = app.listen(process.env.PORT || 8000);
export default async () => {
  server.close();
};
