import type React from 'react';
import { useState, useEffect } from 'react';
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

const PriceCalculator: React.FC = () => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your pricing calculation and navigation logic here
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl mx-auto mt-10 mb-16">
      <DiscountBanner />

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

      <button
        type="submit"
        onClick={handleSubmit}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-extrabold rounded-md py-4 text-xl mt-6 flex items-center justify-center shadow-lg transition"
      >
        <span className="text-2xl mr-2">🔍</span>CALCULATE MY PRICE
      </button>
    </div>
  );
};

export default PriceCalculator;
