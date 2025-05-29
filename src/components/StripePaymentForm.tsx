import type React from 'react';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Load Stripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const getStripePublishableKey = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key || key.includes('your_live_publishable_key_here') || key.includes('your_actual_key_here')) {
    console.error('Stripe publishable key not found or is placeholder. Please set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables.');
    return null;
  }
  return key;
};

const stripePromise = getStripePublishableKey() ? loadStripe(getStripePublishableKey()!) : null;

interface StripePaymentFormProps {
  amount: number;
  email: string;
  description: string;
  onPaymentSuccess: () => void;
  onPaymentError?: (error: string) => void;
}

const CheckoutForm: React.FC<StripePaymentFormProps> = ({
  amount,
  email,
  description,
  onPaymentSuccess,
  onPaymentError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setPaymentError('Card element not found');
      setIsLoading(false);
      return;
    }

    try {
      // Create payment intent on the server
      const response = await fetch('/.netlify/functions/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          description,
          receipt_email: email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();

      // Confirm the payment with the card element
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: email,
          },
        },
      });

      if (error) {
        setPaymentError(error.message || 'An error occurred during payment');
        onPaymentError?.(error.message || 'An error occurred during payment');
      } else if (paymentIntent.status === 'succeeded') {
        onPaymentSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setPaymentError(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Payment Information</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="border rounded-md p-3 bg-white">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {paymentError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{paymentError}</p>
          </div>
        )}

        <div className="bg-gray-50 p-3 rounded-md mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Amount:</span>
            <span className="font-semibold">${amount.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </button>
      </div>
    </form>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  if (!stripePromise) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Payment Configuration Error
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Stripe is not properly configured. Please check that your environment variables are set correctly.
              </p>
              <p className="mt-1">
                Required: <code>VITE_STRIPE_PUBLISHABLE_KEY</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default StripePaymentForm;
