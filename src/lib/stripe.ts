import { loadStripe } from '@stripe/stripe-js';

// We're using environment variables for the publishable key
// This will be loaded from your environment (e.g., Vite, Netlify, etc.)
// The actual value should be set in your environment configuration (e.g., .env file or Netlify dashboard)
const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_placeholder_key'; // Replace with your actual key in environment variables

// Initialize Stripe
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

/**
 * Creates a payment intent on your server
 * This makes a fetch request to your serverless function
 */
export const createPaymentIntent = async (
  amount: number,
  email: string,
  description: string
) => {
  try {
    // Make an API call to your serverless function
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount, // amount in dollars
        email,
        description,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create payment intent');
    }

    const data = await response.json();
    return {
      clientSecret: data.clientSecret,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);

    // In production, you'd want better error handling
    // For now, return a mock client secret for demonstration
    console.log('Using mock client secret for demonstration');
    return {
      clientSecret: 'mock_client_secret',
    };
  }
};

/**
 * Redirects to Stripe Checkout
 * An alternative to embedded payment forms
 */
export const redirectToCheckout = async (
  priceId: string,
  successUrl: string,
  cancelUrl: string
) => {
  const stripe = await stripePromise;
  if (!stripe) throw new Error('Stripe failed to load');

  // This is where you would redirect to Stripe Checkout
  // In a real implementation, you would either:
  // 1. Create a checkout session on your server and redirect using the session ID
  // 2. Use Stripe's client-only checkout for simple use cases

  // Mock implementation
  console.log('Redirecting to Stripe Checkout:', { priceId, successUrl, cancelUrl });

  // In a real implementation, you would do something like:
  // return stripe.redirectToCheckout({
  //   lineItems: [{ price: priceId, quantity: 1 }],
  //   mode: 'payment',
  //   successUrl,
  //   cancelUrl,
  // });
};

/**
 * ============================================================
 * IMPORTANT NOTES FOR PRODUCTION IMPLEMENTATION:
 * ============================================================
 *
 * 1. Never expose your Stripe secret key in client-side code
 * 2. Always create PaymentIntents on the server-side
 * 3. Use webhooks to confirm successful payments
 * 4. Consider implementing Stripe Checkout for a pre-built, secure payment flow
 * 5. For recurring cleanings, consider using Stripe Subscriptions
 *
 * For a complete solution, you'll need:
 * - A server/backend to handle secret key operations
 * - Proper error handling and payment confirmation
 * - Webhooks for asynchronous payment events
 * - Database to store booking and payment information
 *
 * =========================
 * HOW TO USE TEST VS. LIVE MODE:
 * =========================
 * - Use your test publishable key (pk_test_...) and test secret key (sk_test_...) for development and testing.
 * - When ready to accept real payments, switch to your live publishable key (pk_live_...) and live secret key (sk_live_...).
 * - You can find both sets of keys in your Stripe Dashboard: https://dashboard.stripe.com/apikeys
 * - Never commit your secret keys to version control or expose them in frontend code.
 */
