// This file will run on the server side (Netlify Functions)
// It will create a Stripe Payment Intent securely using your secret key

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event, context) {
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Parse the request body
    const data = JSON.parse(event.body);
    const { amount, email, description, payment_method_id } = data;

    // Validate required fields
    if (!amount || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: amount and email' })
      };
    }

    // Log for debugging (remove in production)
    console.log(`Creating payment intent for ${email}, amount: ${amount}, description: ${description}`);

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // amount should be in cents
      currency: 'cad', // Canadian dollars
      receipt_email: email,
      description: description || 'Cleaning Service',
      payment_method: payment_method_id,
      confirm: !!payment_method_id, // Only confirm if payment method is provided
      confirmation_method: 'manual',
      metadata: {
        customerEmail: email,
        serviceDescription: description || 'Cleaning Service'
      }
    });

    // Return the client secret to the frontend
    return {
      statusCode: 200,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      })
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);

    // Return error information
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to create payment intent'
      })
    };
  }
};
