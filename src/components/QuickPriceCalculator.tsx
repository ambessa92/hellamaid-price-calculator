import type React from 'react';
import { useState } from 'react';

interface FormData {
  // Contact info
  name: string;
  email: string;
  phone: string;
  // Room info
  bedrooms: string;
  bathrooms: string;
  cleaningType: string;
  frequency: string;
  // Schedule info
  preferredDate: string;
  preferredTime: string;
}

// Discount rates based on frequency
const FREQUENCY_DISCOUNTS = {
  oneTime: 0,      // 0% discount
  weekly: 0.20,    // 20% discount
  biWeekly: 0.15,  // 15% discount
  triWeekly: 0.12, // 12% discount
  monthly: 0.10,   // 10% discount
};

// Available time slots
const TIME_SLOTS = [
  '8:00 AM - 11:00 AM',
  '11:00 AM - 2:00 PM',
  '2:00 PM - 5:00 PM',
  '5:00 PM - 8:00 PM'
];

export function QuickPriceCalculator() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    bedrooms: '',
    bathrooms: '',
    cleaningType: 'standard',
    frequency: 'oneTime',
    preferredDate: '',
    preferredTime: '',
  });

  const [price, setPrice] = useState<{
    firstCleanPrice: number | null;
    subsequentCleanPrice: number | null;
    discountRate: number;
    savingsPerClean: number;
  }>({
    firstCleanPrice: null,
    subsequentCleanPrice: null,
    discountRate: 0,
    savingsPerClean: 0,
  });

  const [showQuote, setShowQuote] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculatePrice = () => {
    // Base price for a standard cleaning
    const basePrice = 120;

    // Add cost for bedrooms
    const bedroomCost = Number.parseInt(formData.bedrooms) * 15;

    // Add cost for bathrooms
    const bathroomCost = Number.parseInt(formData.bathrooms) * 20;

    // Apply multiplier based on cleaning type
    const totalBeforeMultiplier = basePrice + bedroomCost + bathroomCost;

    let subtotal = totalBeforeMultiplier;

    // Apply multiplier based on cleaning type
    switch(formData.cleaningType) {
      case 'deep':
        subtotal = totalBeforeMultiplier * 1.5;
        break;
      case 'movein':
        subtotal = totalBeforeMultiplier * 1.75;
        break;
      case 'airbnb':
        subtotal = totalBeforeMultiplier * 1.25;
        break;
      default:
        // standard cleaning, no multiplier
        break;
    }

    // Round subtotal to 2 decimal places
    subtotal = Math.round(subtotal * 100) / 100;

    // Get discount rate based on frequency
    const discountRate = FREQUENCY_DISCOUNTS[formData.frequency as keyof typeof FREQUENCY_DISCOUNTS] || 0;

    // Calculate discount amount for recurring cleanings
    const discountAmount = subtotal * discountRate;

    // Calculate discounted price for recurring cleanings
    const discountedSubtotal = subtotal - discountAmount;

    // Add tax (13%)
    const taxRate = 0.13;
    const firstCleanTax = subtotal * taxRate;
    const subsequentCleanTax = discountedSubtotal * taxRate;

    // Final prices
    const firstCleanPrice = Math.round((subtotal + firstCleanTax) * 100) / 100;
    const subsequentCleanPrice = Math.round((discountedSubtotal + subsequentCleanTax) * 100) / 100;

    // Calculate savings per clean
    const savingsPerClean = Math.round((firstCleanPrice - subsequentCleanPrice) * 100) / 100;

    setPrice({
      firstCleanPrice,
      subsequentCleanPrice: formData.frequency === 'oneTime' ? null : subsequentCleanPrice,
      discountRate,
      savingsPerClean,
    });

    // Show quote section
    setShowQuote(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculatePrice();
  };

  const handlePayment = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  const processPayment = () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setIsProcessingPayment(true);

    // Simulate payment processing
    setTimeout(() => {
      alert(`Payment of $${price.firstCleanPrice?.toFixed(2)} processed successfully via ${selectedPaymentMethod}!
Your cleaning is now booked for ${formData.preferredDate} at ${formData.preferredTime}.
Thank you for choosing our cleaning service!`);
      setIsProcessingPayment(false);
    }, 1500);
  };

  // Helper function to display the discount percentage
  const getDiscountText = (frequency: string) => {
    switch(frequency) {
      case 'weekly': return '20%';
      case 'biWeekly': return '15%';
      case 'triWeekly': return '12%';
      case 'monthly': return '10%';
      default: return '0%';
    }
  };

  // Helper function to display the frequency text
  const getFrequencyText = (frequency: string) => {
    switch(frequency) {
      case 'weekly': return 'Weekly';
      case 'biWeekly': return 'Bi-Weekly';
      case 'triWeekly': return 'Tri-Weekly';
      case 'monthly': return 'Monthly';
      default: return 'One-Time';
    }
  };

  // Format date to display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get minimum bookable date (tomorrow)
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow-md">
      <h2 className="text-xl font-bold mb-4 text-center">Quick Price Calculator</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Information */}
        <div>
          <h3 className="flex items-center font-medium mb-3">
            <span className="mr-2 text-xl">👤</span>
            <span>Contact Information</span>
          </h3>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Your Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
              placeholder="Full Name"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        {/* Property Details */}
        <div>
          <label className="flex items-center mb-1">
            <span className="mr-2 text-xl">🛌</span>
            <span>Number of Bedrooms</span>
          </label>
          <select
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Bedrooms</option>
            <option value="1">1 Bedroom</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3 Bedrooms</option>
            <option value="4">4 Bedrooms</option>
            <option value="5">5 Bedrooms</option>
          </select>
        </div>

        <div>
          <label className="flex items-center mb-1">
            <span className="mr-2 text-xl">🚿</span>
            <span>Number of Bathrooms</span>
          </label>
          <select
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Bathrooms</option>
            <option value="1">1 Bathroom</option>
            <option value="2">2 Bathrooms</option>
            <option value="3">3 Bathrooms</option>
            <option value="4">4 Bathrooms</option>
            <option value="5">5 Bathrooms</option>
          </select>
        </div>

        <div>
          <label className="flex items-center mb-1">
            <span className="mr-2 text-xl">🧹</span>
            <span>Type of Cleaning</span>
          </label>
          <select
            name="cleaningType"
            value={formData.cleaningType}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="standard">Standard Cleaning</option>
            <option value="deep">Deep Cleaning</option>
            <option value="movein">Move In/Out Cleaning</option>
            <option value="airbnb">AirBnB Cleaning</option>
          </select>
        </div>

        <div>
          <label className="flex items-center mb-1">
            <span className="mr-2 text-xl">🗓️</span>
            <span>Cleaning Frequency</span>
          </label>
          <select
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="oneTime">One-Time Cleaning</option>
            <option value="weekly">Weekly (20% off after first clean)</option>
            <option value="biWeekly">Bi-Weekly (15% off after first clean)</option>
            <option value="triWeekly">Tri-Weekly (12% off after first clean)</option>
            <option value="monthly">Monthly (10% off after first clean)</option>
          </select>
        </div>

        {/* Schedule Information */}
        <div>
          <h3 className="flex items-center font-medium mb-3">
            <span className="mr-2 text-xl">📅</span>
            <span>Preferred Schedule</span>
          </h3>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Preferred Date
            </label>
            <input
              type="date"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
              min={getTomorrowDate()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Preferred Time
            </label>
            <select
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Time Slot</option>
              {TIME_SLOTS.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Savings info box - always visible */}
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-2">
          <h4 className="font-medium text-yellow-800 flex items-center">
            <span className="mr-2 text-xl">💰</span>
            <span>Save on recurring cleanings!</span>
          </h4>
          <ul className="text-sm mt-1 space-y-1">
            <li className="flex justify-between">
              <span>Weekly: </span>
              <span className="font-semibold">20% off</span>
            </li>
            <li className="flex justify-between">
              <span>Bi-Weekly: </span>
              <span className="font-semibold">15% off</span>
            </li>
            <li className="flex justify-between">
              <span>Tri-Weekly: </span>
              <span className="font-semibold">12% off</span>
            </li>
            <li className="flex justify-between">
              <span>Monthly: </span>
              <span className="font-semibold">10% off</span>
            </li>
          </ul>
          <p className="text-xs text-yellow-700 mt-1">
            ⭐ Discounts automatically applied after your first cleaning!
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-yellow-400 text-gray-800 font-bold py-2 px-4 rounded hover:bg-yellow-500 transition duration-300 flex items-center justify-center"
        >
          <span className="mr-2 text-xl">🔍</span>
          <span>GET MY PRICE</span>
        </button>
      </form>

      {showQuote && price.firstCleanPrice !== null && (
        <div className="mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-semibold">Your Estimated Price:</p>
            <p className="text-3xl font-bold text-green-600">${price.firstCleanPrice.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">Price includes 13% tax</p>
          </div>

          <div className="mt-4 text-center">
            <div className="border border-gray-200 p-3 rounded mb-3 text-left">
              <p className="font-medium">Booking Details:</p>
              <p><span className="font-medium">Name:</span> {formData.name}</p>
              <p><span className="font-medium">Email:</span> {formData.email}</p>
              <p><span className="font-medium">Phone:</span> {formData.phone}</p>
              <p><span className="font-medium">Date:</span> {formatDate(formData.preferredDate)}</p>
              <p><span className="font-medium">Time:</span> {formData.preferredTime}</p>
            </div>

            <div className="border border-gray-200 p-3 rounded mb-3 text-left">
              <p className="font-medium">Service Details:</p>
              <p>
                <span className="mr-1">🛌</span>
                {formData.bedrooms} bedroom(s) and
                <span className="mx-1">🚿</span>
                {formData.bathrooms} bathroom(s)
              </p>
              <p>
                <span className="mr-2">🧹</span>
                {formData.cleaningType === 'standard' ? 'Standard' :
                  formData.cleaningType === 'deep' ? 'Deep' :
                  formData.cleaningType === 'movein' ? 'Move In/Out' :
                  'AirBnB'} Cleaning
              </p>
              <p>
                <span className="mr-2">🔄</span>
                {getFrequencyText(formData.frequency)} service
              </p>
            </div>

            {formData.frequency !== 'oneTime' && price.subsequentCleanPrice !== null && (
              <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2 flex items-center justify-center">
                  <span className="mr-2 text-xl">💰</span>
                  <span>Recurring Cleaning Savings</span>
                </h4>
                <p className="text-sm">
                  With {getFrequencyText(formData.frequency)} cleaning, you'll save <span className="font-medium">{getDiscountText(formData.frequency)}</span> on
                  all cleanings after your first appointment.
                </p>
                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="font-medium flex justify-between">
                    <span>First Cleaning:</span>
                    <span>${price.firstCleanPrice.toFixed(2)}</span>
                  </p>
                  <p className="font-medium flex justify-between text-green-600">
                    <span>Subsequent Cleanings:</span>
                    <span>${price.subsequentCleanPrice.toFixed(2)}</span>
                  </p>
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    You save ${price.savingsPerClean.toFixed(2)} per cleaning!
                  </p>
                </div>
              </div>
            )}

            {/* Payment Section */}
            <div className="mt-6 border-t pt-4">
              <h4 className="font-medium mb-4 flex items-center justify-center">
                <span className="mr-2 text-xl">💳</span>
                <span>Select Payment Method</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  className={`border p-3 rounded flex flex-col items-center justify-center hover:bg-gray-50 ${selectedPaymentMethod === 'Credit Card' ? 'border-green-500 bg-green-50' : ''}`}
                  onClick={() => handlePayment('Credit Card')}
                  type="button"
                >
                  <span className="text-2xl mb-1">💳</span>
                  <span>Credit Card</span>
                </button>

                <button
                  className={`border p-3 rounded flex flex-col items-center justify-center hover:bg-gray-50 ${selectedPaymentMethod === 'PayPal' ? 'border-green-500 bg-green-50' : ''}`}
                  onClick={() => handlePayment('PayPal')}
                  type="button"
                >
                  <span className="text-2xl mb-1">🅿️</span>
                  <span>PayPal</span>
                </button>

                <button
                  className={`border p-3 rounded flex flex-col items-center justify-center hover:bg-gray-50 ${selectedPaymentMethod === 'Apple Pay' ? 'border-green-500 bg-green-50' : ''}`}
                  onClick={() => handlePayment('Apple Pay')}
                  type="button"
                >
                  <span className="text-2xl mb-1">🍎</span>
                  <span>Apple Pay</span>
                </button>

                <button
                  className={`border p-3 rounded flex flex-col items-center justify-center hover:bg-gray-50 ${selectedPaymentMethod === 'Google Pay' ? 'border-green-500 bg-green-50' : ''}`}
                  onClick={() => handlePayment('Google Pay')}
                  type="button"
                >
                  <span className="text-2xl mb-1">🔄</span>
                  <span>Google Pay</span>
                </button>
              </div>

              <button
                className="w-full bg-green-600 text-white py-3 px-6 rounded hover:bg-green-700 transition duration-300 flex items-center justify-center"
                onClick={processPayment}
                disabled={isProcessingPayment}
                type="button"
              >
                {isProcessingPayment ? (
                  <>
                    <span className="animate-spin mr-2">⚙️</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="mr-2 text-xl">🔒</span>
                    <span>Pay ${price.firstCleanPrice.toFixed(2)} & Book Now</span>
                  </>
                )}
              </button>

              <p className="text-xs text-center mt-2 text-gray-500">
                Your payment information is secure and encrypted. Full payment is required to confirm your booking.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
