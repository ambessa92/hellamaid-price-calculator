// Instructions: Transform the PriceCalculator into a complete multi-step booking system with date/time selection, address collection, Stripe payment, and email confirmations

import type React from 'react';
import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import StripePaymentForm from './StripePaymentForm';

// Pricing data structure
const PRICING = {
  basePrices: {
    small: 89,
    medium: 109,
    large: 129,
    xlarge: 149,
    xxlarge: 179,
  },
  bedroomPrices: {
    1: 10,
    2: 20,
    3: 30,
    4: 40,
    5: 50,
  },
  bathroomPrices: {
    1: 15,
    2: 30,
    3: 45,
    4: 60,
    5: 75,
  },
  halfBathPrices: {
    1: 8,
    2: 16,
    3: 24,
  },
  cleaningTypeMultipliers: {
    standard: 1.0,
    deep: 1.5,
    movein: 1.75,
    airbnb: 1.25,
    office: 1.2,
  },
  addOns: {
    insideFridge: 25,
    insideOven: 25,
    insideCabinets: 30,
    windowsUpTo6: 45,
    windowsUpTo12: 80,
    windowsUpTo24: 150,
    changeBedSheets: 10,
    loadDishwasher: 15,
    sanitization: 40,
    basement: 40,
    additionalKitchen: 50,
  },
  frequencyDiscounts: {
    oneTime: 0,
    weekly: 0.20,
    biweekly: 0.15,
    triweekly: 0.12,
    monthly: 0.10,
  },
  taxRate: 0.13,
};

// Time slots for booking
const TIME_SLOTS = [
  { value: '8-11', label: '8:00 AM - 11:00 AM' },
  { value: '11-2', label: '11:00 AM - 2:00 PM' },
  { value: '2-5', label: '2:00 PM - 5:00 PM' },
  { value: '5-8', label: '5:00 PM - 8:00 PM' },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  halfBaths: string;
  cleaningType: string;
  frequency: string;
  selectedAddOns: string[];
}

interface AddressData {
  street: string;
  city: string;
  postalCode: string;
  specialInstructions: string;
}

interface BookingData {
  date: string;
  timeSlot: string;
}

interface PriceData {
  basePrice: number;
  bedroomCost: number;
  bathroomCost: number;
  halfBathCost: number;
  addOnsCost: number;
  subtotal: number;
  recurringDiscount: number;
  discountedSubtotal: number;
  tax: number;
  totalPrice: number;
  firstCleanPrice: number;
  subsequentCleanPrice: number;
  savingsPerClean: number;
}

const DiscountBanner = () => (
  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 mb-8">
    <div className="flex items-center justify-center mb-4 text-xl font-bold">
      <span className="mr-2 text-2xl">💰</span>
      <span>Save on Recurring Cleanings!</span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-bold">
      <div className="bg-white rounded-lg py-3 text-center shadow text-yellow-900">
        <span className="block text-lg font-extrabold">Weekly</span>
        <span className="block text-2xl">20% OFF</span>
      </div>
      <div className="bg-white rounded-lg py-3 text-center shadow text-yellow-900">
        <span className="block text-lg font-extrabold">Bi-Weekly</span>
        <span className="block text-2xl">15% OFF</span>
      </div>
      <div className="bg-white rounded-lg py-3 text-center shadow text-yellow-900">
        <span className="block text-lg font-extrabold">Tri-Weekly</span>
        <span className="block text-2xl">12% OFF</span>
      </div>
      <div className="bg-white rounded-lg py-3 text-center shadow text-yellow-900">
        <span className="block text-lg font-extrabold">Monthly</span>
        <span className="block text-2xl">10% OFF</span>
      </div>
    </div>
    <div className="text-center mt-4 text-gray-700 font-medium">
      Discounts automatically applied after your first cleaning!
    </div>
  </div>
);

// Utility functions for date handling
const getNextAvailableDates = (count: number = 14): string[] => {
  const dates: string[] = [];
  const today = new Date();
  let currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow

  while (dates.length < count) {
    // Skip Sundays (0 = Sunday)
    if (currentDate.getDay() !== 0) {
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const generateBookingNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `HM${timestamp.slice(-6)}${random}`;
};

const PriceCalculator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    homeSize: '',
    bedrooms: '',
    bathrooms: '',
    halfBaths: '',
    cleaningType: 'standard',
    frequency: 'oneTime',
    selectedAddOns: [],
  });

  const [addressData, setAddressData] = useState<AddressData>({
    street: '',
    city: '',
    postalCode: '',
    specialInstructions: '',
  });

  const [bookingData, setBookingData] = useState<BookingData>({
    date: '',
    timeSlot: '',
  });

  const [price, setPrice] = useState<PriceData>({
    basePrice: 0,
    bedroomCost: 0,
    bathroomCost: 0,
    halfBathCost: 0,
    addOnsCost: 0,
    subtotal: 0,
    recurringDiscount: 0,
    discountedSubtotal: 0,
    tax: 0,
    totalPrice: 0,
    firstCleanPrice: 0,
    subsequentCleanPrice: 0,
    savingsPerClean: 0,
  });

  const [bookingNumber, setBookingNumber] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ... existing code ... <pricing calculation logic>

  useEffect(() => {
    if (formData.homeSize && formData.bedrooms && formData.bathrooms) {
      calculatePrice();
    }
  }, [formData]);

  const calculatePrice = () => {
    let basePrice = 0;
    if (formData.homeSize && PRICING.basePrices[formData.homeSize as keyof typeof PRICING.basePrices]) {
      basePrice = PRICING.basePrices[formData.homeSize as keyof typeof PRICING.basePrices];
    }

    let bedroomCost = 0;
    if (formData.bedrooms && PRICING.bedroomPrices[Number.parseInt(formData.bedrooms) as keyof typeof PRICING.bedroomPrices]) {
      bedroomCost = PRICING.bedroomPrices[Number.parseInt(formData.bedrooms) as keyof typeof PRICING.bedroomPrices];
    }

    let bathroomCost = 0;
    if (formData.bathrooms && PRICING.bathroomPrices[Number.parseInt(formData.bathrooms) as keyof typeof PRICING.bathroomPrices]) {
      bathroomCost = PRICING.bathroomPrices[Number.parseInt(formData.bathrooms) as keyof typeof PRICING.bathroomPrices];
    }

    let halfBathCost = 0;
    if (formData.halfBaths && PRICING.halfBathPrices[Number.parseInt(formData.halfBaths) as keyof typeof PRICING.halfBathPrices]) {
      halfBathCost = PRICING.halfBathPrices[Number.parseInt(formData.halfBaths) as keyof typeof PRICING.halfBathPrices];
    }

    let addOnsCost = 0;
    formData.selectedAddOns.forEach(addOn => {
      if (PRICING.addOns[addOn as keyof typeof PRICING.addOns]) {
        addOnsCost += PRICING.addOns[addOn as keyof typeof PRICING.addOns];
      }
    });

    const subtotalBeforeMultiplier = basePrice + bedroomCost + bathroomCost + halfBathCost + addOnsCost;
    let subtotal = subtotalBeforeMultiplier;

    if (formData.cleaningType && PRICING.cleaningTypeMultipliers[formData.cleaningType as keyof typeof PRICING.cleaningTypeMultipliers]) {
      subtotal *= PRICING.cleaningTypeMultipliers[formData.cleaningType as keyof typeof PRICING.cleaningTypeMultipliers];
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const firstCleanPrice = subtotal;

    let discountRate = 0;
    if (formData.frequency && PRICING.frequencyDiscounts[formData.frequency as keyof typeof PRICING.frequencyDiscounts]) {
      discountRate = PRICING.frequencyDiscounts[formData.frequency as keyof typeof PRICING.frequencyDiscounts];
    }

    const recurringDiscount = Math.round(subtotal * discountRate * 100) / 100;
    const discountedSubtotal = Math.round((subtotal - recurringDiscount) * 100) / 100;
    const savingsPerClean = recurringDiscount;

    const firstCleanTax = Math.round(firstCleanPrice * PRICING.taxRate * 100) / 100;
    const subsequentCleanTax = Math.round(discountedSubtotal * PRICING.taxRate * 100) / 100;

    const firstCleanTotalPrice = firstCleanPrice + firstCleanTax;
    const subsequentCleanTotalPrice = discountedSubtotal + subsequentCleanTax;

    setPrice({
      basePrice,
      bedroomCost,
      bathroomCost,
      halfBathCost,
      addOnsCost,
      subtotal: firstCleanPrice,
      recurringDiscount,
      discountedSubtotal,
      tax: firstCleanTax,
      totalPrice: firstCleanTotalPrice,
      firstCleanPrice: firstCleanTotalPrice,
      subsequentCleanPrice: subsequentCleanTotalPrice,
      savingsPerClean,
    });
  };

  const getFrequencyText = (frequency: string): string => {
    switch(frequency) {
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Bi-Weekly';
      case 'triweekly': return 'Tri-Weekly';
      case 'monthly': return 'Monthly';
      default: return 'One-Time';
    }
  };

  const getDiscountPercentage = (frequency: string): string => {
    switch(frequency) {
      case 'weekly': return '20%';
      case 'biweekly': return '15%';
      case 'triweekly': return '12%';
      case 'monthly': return '10%';
      default: return '0%';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const isChecked = (e.target as HTMLInputElement).checked;
      const addOnValue = (e.target as HTMLInputElement).value;
      setFormData(prevData => ({
        ...prevData,
        selectedAddOns: isChecked
          ? [...prevData.selectedAddOns, addOnValue]
          : prevData.selectedAddOns.filter(item => item !== addOnValue)
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddressData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const sendConfirmationEmails = async (bookingNumber: string) => {
    const emailjsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const emailjsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const emailjsUserId = import.meta.env.VITE_EMAILJS_USER_ID;

    if (!emailjsServiceId || !emailjsTemplateId || !emailjsUserId) {
      console.warn('EmailJS not configured - skipping email notifications');
      return;
    }

    const emailData = {
      booking_number: bookingNumber,
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      service_date: formatDateForDisplay(bookingData.date),
      service_time: TIME_SLOTS.find(slot => slot.value === bookingData.timeSlot)?.label,
      service_address: `${addressData.street}, ${addressData.city}, ${addressData.postalCode}`,
      cleaning_type: formData.cleaningType,
      frequency: getFrequencyText(formData.frequency),
      total_price: price.firstCleanPrice.toFixed(2),
      special_instructions: addressData.specialInstructions || 'None',
    };

    try {
      await emailjs.send(emailjsServiceId, emailjsTemplateId, emailData, emailjsUserId);
      console.log('Confirmation email sent successfully');
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculatePrice();
    setCurrentStep(2);
  };

  const handleDateTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(3);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(4);
  };

  const handlePaymentSuccess = async () => {
    setIsProcessing(true);
    const newBookingNumber = generateBookingNumber();
    setBookingNumber(newBookingNumber);
    
    // Send confirmation emails
    await sendConfirmationEmails(newBookingNumber);
    
    setPaymentSuccess(true);
    setCurrentStep(5);
    setIsProcessing(false);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error}`);
  };

  const restartBooking = () => {
    setCurrentStep(1);
    setFormData({
      name: '',
      email: '',
      phone: '',
      homeSize: '',
      bedrooms: '',
      bathrooms: '',
      halfBaths: '',
      cleaningType: 'standard',
      frequency: 'oneTime',
      selectedAddOns: [],
    });
    setAddressData({
      street: '',
      city: '',
      postalCode: '',
      specialInstructions: '',
    });
    setBookingData({
      date: '',
      timeSlot: '',
    });
    setPaymentSuccess(false);
    setBookingNumber('');
  };

  // Step 1: Service Details Form
  if (currentStep === 1) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl mx-auto mt-10 mb-16">
        <DiscountBanner />

        <div className="mb-6">
          <div className="flex items-center mb-4">
            <span className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">1</span>
            <h2 className="text-2xl font-bold">Service Details</h2>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="mb-8">
          <div className="flex items-center text-xl font-semibold mb-4">
            <span className="mr-2">👤</span>Contact Information
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-800 font-semibold mb-1">Your Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border rounded-md p-3 font-medium focus:ring-2 focus:ring-yellow-400"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-gray-800 font-semibold mb-1">Email Address</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border rounded-md p-3 font-medium focus:ring-2 focus:ring-yellow-400"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-gray-800 font-semibold mb-1">Phone Number</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full border rounded-md p-3 font-medium focus:ring-2 focus:ring-yellow-400"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        {/* ... existing code ... <all form sections for home size, bedrooms, bathrooms, etc> */}

        {/* Home Size Section */}
        <div className="mb-8">
          <div className="text-lg font-bold mb-2">Home Size</div>
          <select
            name="homeSize"
            value={formData.homeSize}
            onChange={handleChange}
            required
            className="w-full border rounded-md p-3 text-base font-medium"
          >
            <option value="">Select Home Size</option>
            <option value="small">Small (500-999 sq ft)</option>
            <option value="medium">Medium (1000-1499 sq ft)</option>
            <option value="large">Large (1500-1999 sq ft)</option>
            <option value="xlarge">X-Large (2000-2499 sq ft)</option>
            <option value="xxlarge">XX-Large (2500+ sq ft)</option>
          </select>
        </div>

        {/* Bedrooms Section */}
        <div className="mb-8">
          <div className="text-lg font-bold mb-2">Bedrooms</div>
          <select
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleChange}
            required
            className="w-full border rounded-md p-3 text-base font-medium"
          >
            <option value="">Select Bedrooms</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5+</option>
          </select>
        </div>

        {/* Bathrooms Section */}
        <div className="mb-8">
          <div className="text-lg font-bold mb-2">Bathrooms</div>
          <select
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleChange}
            required
            className="w-full border rounded-md p-3 text-base font-medium"
          >
            <option value="">Select Bathrooms</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5+</option>
          </select>
        </div>

        {/* Half Baths Section */}
        <div className="mb-8">
          <div className="text-lg font-bold mb-2">Half Baths</div>
          <select
            name="halfBaths"
            value={formData.halfBaths}
            onChange={handleChange}
            className="w-full border rounded-md p-3 text-base font-medium"
          >
            <option value="">None</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3+</option>
          </select>
        </div>

        {/* Cleaning Type Section */}
        <div className="mb-8">
          <div className="text-lg font-bold mb-2">Type of Cleaning</div>
          <select
            name="cleaningType"
            value={formData.cleaningType}
            onChange={handleChange}
            required
            className="w-full border rounded-md p-3 text-base font-medium"
          >
            <option value="standard">Standard Cleaning</option>
            <option value="deep">Deep Cleaning</option>
            <option value="movein">Move In/Out Cleaning</option>
            <option value="airbnb">AirBnB Cleaning</option>
            <option value="office">Office Cleaning</option>
          </select>
        </div>

        {/* Frequency Section */}
        <div className="mb-8">
          <div className="text-lg font-bold mb-2">Cleaning Frequency</div>
          <select
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            required
            className="w-full border rounded-md p-3 text-base font-medium"
          >
            <option value="oneTime">One-Time Cleaning</option>
            <option value="weekly">Weekly Cleaning</option>
            <option value="biweekly">Bi-Weekly Cleaning</option>
            <option value="triweekly">Tri-Weekly Cleaning</option>
            <option value="monthly">Monthly Cleaning</option>
          </select>
        </div>

        {/* Add-Ons Section */}
        <div className="mb-8">
          <div className="text-lg font-bold mb-2">Additional Services (Optional)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                value="insideFridge"
                checked={formData.selectedAddOns.includes('insideFridge')}
                onChange={handleChange}
                className="mr-2"
              />
              Inside Fridge (+$25)
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="insideOven"
                checked={formData.selectedAddOns.includes('insideOven')}
                onChange={handleChange}
                className="mr-2"
              />
              Inside Oven (+$25)
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="insideCabinets"
                checked={formData.selectedAddOns.includes('insideCabinets')}
                onChange={handleChange}
                className="mr-2"
              />
              Inside Cabinets (+$30)
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="windowsUpTo6"
                checked={formData.selectedAddOns.includes('windowsUpTo6')}
                onChange={handleChange}
                className="mr-2"
              />
              Windows (up to 6) (+$45)
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="changeBedSheets"
                checked={formData.selectedAddOns.includes('changeBedSheets')}
                onChange={handleChange}
                className="mr-2"
              />
              Change Bed Sheets (+$10)
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="loadDishwasher"
                checked={formData.selectedAddOns.includes('loadDishwasher')}
                onChange={handleChange}
                className="mr-2"
              />
              Load Dishwasher (+$15)
            </label>
          </div>
        </div>

        {/* Price Preview */}
        {price.totalPrice > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Price Preview:</h3>
            <p className="text-2xl font-bold text-green-600">${price.firstCleanPrice.toFixed(2)}</p>
            {formData.frequency !== 'oneTime' && (
              <p className="text-sm text-gray-600">
                Subsequent cleanings: ${price.subsequentCleanPrice.toFixed(2)} ({getDiscountPercentage(formData.frequency)} off)
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          onClick={handleSubmit}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-extrabold rounded-md py-4 text-xl mt-6 flex items-center justify-center shadow-lg transition"
        >
          <span className="text-2xl mr-2">📅</span>CONTINUE TO DATE & TIME
        </button>
      </div>
    );
  }

  // Step 2: Date & Time Selection
  if (currentStep === 2) {
    const availableDates = getNextAvailableDates();

    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl mx-auto mt-10 mb-16">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <span className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">2</span>
            <h2 className="text-2xl font-bold">Select Date & Time</h2>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '50%' }}></div>
          </div>
        </div>

        <form onSubmit={handleDateTimeSubmit}>
          <div className="mb-8">
            <label className="block text-lg font-bold mb-4">📅 Select Date</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableDates.map(date => (
                <label key={date} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-yellow-50">
                  <input
                    type="radio"
                    name="date"
                    value={date}
                    checked={bookingData.date === date}
                    onChange={handleBookingChange}
                    className="mr-3"
                    required
                  />
                  <span>{formatDateForDisplay(date)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-lg font-bold mb-4">🕐 Select Time Slot</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TIME_SLOTS.map(slot => (
                <label key={slot.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-yellow-50">
                  <input
                    type="radio"
                    name="timeSlot"
                    value={slot.value}
                    checked={bookingData.timeSlot === slot.value}
                    onChange={handleBookingChange}
                    className="mr-3"
                    required
                  />
                  <span>{slot.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded transition"
            >
              ← Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded transition"
            >
              Continue to Address →
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Step 3: Address Collection
  if (currentStep === 3) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl mx-auto mt-10 mb-16">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <span className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">3</span>
            <h2 className="text-2xl font-bold">Service Address</h2>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        <form onSubmit={handleAddressSubmit}>
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2">🏠 Street Address</label>
            <input
              name="street"
              value={addressData.street}
              onChange={handleAddressChange}
              required
              className="w-full border rounded-md p-3 font-medium focus:ring-2 focus:ring-yellow-400"
              placeholder="123 Main Street, Apt 4B"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-800 font-semibold mb-2">🏙️ City</label>
              <input
                name="city"
                value={addressData.city}
                onChange={handleAddressChange}
                required
                className="w-full border rounded-md p-3 font-medium focus:ring-2 focus:ring-yellow-400"
                placeholder="Toronto"
              />
            </div>
            <div>
              <label className="block text-gray-800 font-semibold mb-2">📮 Postal Code</label>
              <input
                name="postalCode"
                value={addressData.postalCode}
                onChange={handleAddressChange}
                required
                className="w-full border rounded-md p-3 font-medium focus:ring-2 focus:ring-yellow-400"
                placeholder="M1A 1A1"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-gray-800 font-semibold mb-2">📝 Special Instructions (Optional)</label>
            <textarea
              name="specialInstructions"
              value={addressData.specialInstructions}
              onChange={handleAddressChange}
              rows={3}
              className="w-full border rounded-md p-3 font-medium focus:ring-2 focus:ring-yellow-400"
              placeholder="Access instructions, pet information, or special requests..."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded transition"
            >
              ← Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded transition"
            >
              Continue to Payment →
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Step 4: Payment
  if (currentStep === 4) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl mx-auto mt-10 mb-16">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <span className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">4</span>
            <h2 className="text-2xl font-bold">Payment</h2>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Booking Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p><strong>Name:</strong> {formData.name}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Phone:</strong> {formData.phone}</p>
            </div>
            <div>
              <p><strong>Date:</strong> {formatDateForDisplay(bookingData.date)}</p>
              <p><strong>Time:</strong> {TIME_SLOTS.find(slot => slot.value === bookingData.timeSlot)?.label}</p>
              <p><strong>Address:</strong> {addressData.street}, {addressData.city}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-green-600">${price.firstCleanPrice.toFixed(2)}</span>
            </div>
            {formData.frequency !== 'oneTime' && (
              <p className="text-sm text-gray-600 mt-1">
                Subsequent cleanings: ${price.subsequentCleanPrice.toFixed(2)} ({getDiscountPercentage(formData.frequency)} off)
              </p>
            )}
          </div>
        </div>

        {/* Payment Form */}
        <StripePaymentForm
          amount={price.firstCleanPrice}
          email={formData.email}
          description={`Hellamaid Cleaning Service - ${getFrequencyText(formData.frequency)} ${formData.cleaningType} cleaning`}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded transition"
          >
            ← Back to Address
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Confirmation
  if (currentStep === 5) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl mx-auto mt-10 mb-16">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-3xl font-bold text-green-600 mb-2">Booking Confirmed!</h2>
          <p className="text-lg text-gray-600">Your cleaning service has been successfully booked.</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Booking Details</h3>
          <div className="space-y-2">
            <p><strong>Booking Number:</strong> {bookingNumber}</p>
            <p><strong>Date & Time:</strong> {formatDateForDisplay(bookingData.date)} at {TIME_SLOTS.find(slot => slot.value === bookingData.timeSlot)?.label}</p>
            <p><strong>Address:</strong> {addressData.street}, {addressData.city}, {addressData.postalCode}</p>
            <p><strong>Service:</strong> {getFrequencyText(formData.frequency)} {formData.cleaningType} cleaning</p>
            <p><strong>Amount Paid:</strong> ${price.firstCleanPrice.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold mb-2">📧 What's Next?</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>You'll receive a confirmation email with all booking details</li>
            <li>Our team will contact you 24 hours before your appointment</li>
            <li>Please ensure someone is available to provide access to your home</li>
            <li>Have any special instructions ready for our cleaning team</li>
          </ul>
        </div>

        <div className="text-center">
          <button
            onClick={restartBooking}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded transition"
          >
            Book Another Cleaning
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PriceCalculator;