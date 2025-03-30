const { createClient } = require('redis');

// Simulated email service (replace with real email provider like Nodemailer)
const sendWelcomeEmail = async (email, name) => {
  console.log(`Sending welcome email to ${email}: Welcome, ${name}!`);
  // Example: Integrate Nodemailer here
};

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function startWorker() {
  await redisClient.connect();
  console.log('Welcome Worker started');

  // Subscribe to the user:registered channel
  await redisClient.subscribe('user:registered', async (message) => {
    const { userId, email, name } = JSON.parse(message);
    console.log(`Processing user:registered event for ${email}`);
    await sendWelcomeEmail(email, name);
  });
}

startWorker().catch(console.error);