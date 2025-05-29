import { useState } from 'react';
import emailjs from '@emailjs/browser';
import StripePaymentForm from './StripePaymentForm';

interface PricingData {
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  cleaningType: string;
  frequency: string;
  extras: string[];
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface BookingDetails {
  date: string;
  time: string;
}

export default function PriceCalculator() {
  const [step, setStep] = useState(1);
  const [pricingData, setPricingData] = useState<PricingData>({
    homeSize: '',
    bedrooms: '',
    bathrooms: '',
    cleaningType: '',
    frequency: '',
    extras: []
  });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    date: '',
    time: ''
  });
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState<{[key: string]: number}>({});
  const [isCalculated, setIsCalculated] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');

  const homeSizeOptions = [
    { value: 'studio', label: '🏠 Studio (up to 600 sq ft)', price: 80 },
    { value: 'one-bedroom', label: '🏡 1 Bedroom (600-900 sq ft)', price: 100 },
    { value: 'two-bedroom', label: '🏘️ 2 Bedroom (900-1200 sq ft)', price: 120 },
    { value: 'three-bedroom', label: '🏠 3 Bedroom (1200-1600 sq ft)', price: 150 },
    { value: 'four-bedroom', label: '🏰 4 Bedroom (1600-2200 sq ft)', price: 180 },
    { value: 'five-bedroom', label: '🏛️ 5+ Bedroom (2200+ sq ft)', price: 220 }
  ];

  const bedroomOptions = [
    { value: '0', label: '0 Bedrooms', price: 0 },
    { value: '1', label: '1 Bedroom', price: 15 },
    { value: '2', label: '2 Bedrooms', price: 25 },
    { value: '3', label: '3 Bedrooms', price: 35 },
    { value: '4', label: '4 Bedrooms', price: 45 },
    { value: '5+', label: '5+ Bedrooms', price: 60 }
  ];

  const bathroomOptions = [
    { value: '1', label: '1 Bathroom', price: 0 },
    { value: '1.5', label: '1.5 Bathrooms', price: 10 },
    { value: '2', label: '2 Bathrooms', price: 20 },
    { value: '2.5', label: '2.5 Bathrooms', price: 30 },
    { value: '3', label: '3 Bathrooms', price: 40 },
    { value: '3.5', label: '3.5 Bathrooms', price: 50 },
    { value: '4+', label: '4+ Bathrooms', price: 60 }
  ];

  const cleaningTypeOptions = [
    { value: 'standard', label: '🧹 Standard Cleaning', multiplier: 1.0 },
    { value: 'deep', label: '🧽 Deep Cleaning', multiplier: 1.5 },
    { value: 'move-in', label: '📦 Move-in Cleaning', multiplier: 1.4 },
    { value: 'move-out', label: '🚚 Move-out Cleaning', multiplier: 1.4 },
    { value: 'post-construction', label: '🏗️ Post-Construction', multiplier: 2.0 }
  ];

  const frequencyOptions = [
    { value: 'one-time', label: '⭐ One-time', discount: 0 },
    { value: 'weekly', label: '📅 Weekly', discount: 0.15 },
    { value: 'bi-weekly', label: '📆 Bi-weekly', discount: 0.10 },
    { value: 'monthly', label: '🗓️ Monthly', discount: 0.05 }
  ];

  const extrasOptions = [
    { value: 'inside-fridge', label: '❄️ Inside Fridge', price: 25 },
    { value: 'inside-oven', label: '🔥 Inside Oven', price: 25 },
    { value: 'inside-microwave', label: '📱 Inside Microwave', price: 15 },
    { value: 'inside-cabinets', label: '🗄️ Inside Cabinets', price: 40 },
    { value: 'windows-interior', label: '🪟 Interior Windows', price: 30 },
    { value: 'baseboards', label: '🧽 Baseboards', price: 20 },
    { value: 'garage', label: '🚗 Garage', price: 50 },
    { value: 'laundry', label: '👕 Laundry', price: 30 }
  ];

  const calculatePrice = () => {
    const basePrice = homeSizeOptions.find(option => option.value === pricingData.homeSize)?.price || 0;
    const bedroomPrice = bedroomOptions.find(option => option.value === pricingData.bedrooms)?.price || 0;
    const bathroomPrice = bathroomOptions.find(option => option.value === pricingData.bathrooms)?.price || 0;
    const cleaningMultiplier = cleaningTypeOptions.find(option => option.value === pricingData.cleaningType)?.multiplier || 1.0;
    const frequencyDiscount = frequencyOptions.find(option => option.value === pricingData.frequency)?.discount || 0;

    const extrasPrice = pricingData.extras.reduce((total, extra) => {
      const extraOption = extrasOptions.find(option => option.value === extra);
      return total + (extraOption?.price || 0);
    }, 0);

    const subtotal = (basePrice + bedroomPrice + bathroomPrice) * cleaningMultiplier;
    const discount = subtotal * frequencyDiscount;
    const finalPrice = subtotal - discount + extrasPrice;

    const breakdown = {
      'Base Price': basePrice,
      'Bedrooms': bedroomPrice,
      'Bathrooms': bathroomPrice,
      'Cleaning Type': subtotal - (basePrice + bedroomPrice + bathroomPrice),
      'Extras': extrasPrice,
      'Frequency Discount': -discount
    };

    setPriceBreakdown(breakdown);
    setCalculatedPrice(finalPrice);
    setIsCalculated(true);
  };

  const handleExtrasChange = (extraValue: string) => {
    setPricingData(prev => ({
      ...prev,
      extras: prev.extras.includes(extraValue)
        ? prev.extras.filter(extra => extra !== extraValue)
        : [...prev.extras, extraValue]
    }));
  };

  const handleNextStep = () => {
    if (step === 1 && !isCalculated) {
      calculatePrice();
      return; // Don't proceed to next step yet, just show the price
    }
    setStep(step + 1);
  };

  const handlePaymentSuccess = async () => {
    const newBookingNumber = `BK${Date.now()}`;
    setBookingNumber(newBookingNumber);
    setPaymentSuccess(true);

    // Send email notification
    await sendEmailNotification(newBookingNumber);
    setStep(5);
  };

  const sendEmailNotification = async (bookingNum: string) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const userId = import.meta.env.VITE_EMAILJS_USER_ID;

    if (!serviceId || !templateId || !userId) {
      console.error('EmailJS configuration missing');
      return;
    }

    try {
      await emailjs.send(serviceId, templateId, {
        booking_number: bookingNum,
        customer_name: `${contactInfo.firstName} ${contactInfo.lastName}`,
        customer_email: contactInfo.email,
        customer_phone: contactInfo.phone,
        service_date: bookingDetails.date,
        service_time: bookingDetails.time,
        service_address: `${contactInfo.address}, ${contactInfo.city}, ${contactInfo.state} ${contactInfo.zipCode}`,
        cleaning_type: cleaningTypeOptions.find(option => option.value === pricingData.cleaningType)?.label || pricingData.cleaningType,
        frequency: frequencyOptions.find(option => option.value === pricingData.frequency)?.label || pricingData.frequency,
        total_price: calculatedPrice.toFixed(2),
        special_instructions: pricingData.extras.map(extra =>
          extrasOptions.find(option => option.value === extra)?.label || extra
        ).join(', ')
      }, userId);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour += 3) {
      const endHour = Math.min(hour + 3, 20);
      const startTime = hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
      const endTime = endHour === 12 ? '12:00 PM' : endHour > 12 ? `${endHour - 12}:00 PM` : `${endHour}:00 AM`;
      slots.push(`${startTime} - ${endTime}`);
    }
    return slots;
  };

  const renderStep1 = () => (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">✨ Get Your Cleaning Quote</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-gray-700 mb-3">🏠 Home Size</label>
          <select
            value={pricingData.homeSize}
            onChange={(e) => setPricingData({...pricingData, homeSize: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">Select your home size</option>
            {homeSizeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-lg font-bold text-gray-700 mb-3">🛏️ Bedrooms</label>
          <select
            value={pricingData.bedrooms}
            onChange={(e) => setPricingData({...pricingData, bedrooms: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">Select number of bedrooms</option>
            {bedroomOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-lg font-bold text-gray-700 mb-3">🚿 Bathrooms</label>
          <select
            value={pricingData.bathrooms}
            onChange={(e) => setPricingData({...pricingData, bathrooms: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">Select number of bathrooms</option>
            {bathroomOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-lg font-bold text-gray-700 mb-3">🧹 Cleaning Type</label>
          <select
            value={pricingData.cleaningType}
            onChange={(e) => setPricingData({...pricingData, cleaningType: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">Select cleaning type</option>
            {cleaningTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-lg font-bold text-gray-700 mb-3">📅 Frequency</label>
          <select
            value={pricingData.frequency}
            onChange={(e) => setPricingData({...pricingData, frequency: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">Select frequency</option>
            {frequencyOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-lg font-bold text-gray-700 mb-3">✨ Additional Services</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {extrasOptions.map(option => (
              <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pricingData.extras.includes(option.value)}
                  onChange={() => handleExtrasChange(option.value)}
                  className="mr-3 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <span className="text-sm">{option.label} (+${option.price})</span>
              </label>
            ))}
          </div>
        </div>

        {isCalculated && (
          <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-xl font-bold mb-4">💰 Price Breakdown</h3>
            {Object.entries(priceBreakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center mb-2">
                <span className="text-gray-700">{key}:</span>
                <span className={value < 0 ? "text-green-600 font-semibold" : "text-gray-900"}>
                  {value < 0 ? '-' : ''}${Math.abs(value).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-green-600">${calculatedPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={isCalculated ? () => setStep(2) : calculatePrice}
          disabled={!pricingData.homeSize || !pricingData.bedrooms || !pricingData.bathrooms || !pricingData.cleaningType || !pricingData.frequency}
          className="w-full bg-yellow-400 text-gray-800 py-3 px-6 rounded-lg font-bold text-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCalculated ? '📞 Book This Service' : '💰 Calculate My Price'}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">📞 Contact Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">👤 First Name</label>
          <input
            type="text"
            value={contactInfo.firstName}
            onChange={(e) => setContactInfo({...contactInfo, firstName: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="John"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">👤 Last Name</label>
          <input
            type="text"
            value={contactInfo.lastName}
            onChange={(e) => setContactInfo({...contactInfo, lastName: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📧 Email</label>
          <input
            type="email"
            value={contactInfo.email}
            onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📱 Phone</label>
          <input
            type="tel"
            value={contactInfo.phone}
            onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">🏠 Address</label>
        <input
          type="text"
          value={contactInfo.address}
          onChange={(e) => setContactInfo({...contactInfo, address: e.target.value})}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="123 Main Street"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">🏙️ City</label>
          <input
            type="text"
            value={contactInfo.city}
            onChange={(e) => setContactInfo({...contactInfo, city: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="Toronto"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">🗺️ State/Province</label>
          <input
            type="text"
            value={contactInfo.state}
            onChange={(e) => setContactInfo({...contactInfo, state: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="ON"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📮 Zip/Postal Code</label>
          <input
            type="text"
            value={contactInfo.zipCode}
            onChange={(e) => setContactInfo({...contactInfo, zipCode: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="M5V 3A1"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep(1)}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={!contactInfo.firstName || !contactInfo.lastName || !contactInfo.email || !contactInfo.phone || !contactInfo.address || !contactInfo.city || !contactInfo.state || !contactInfo.zipCode}
          className="flex-1 bg-yellow-400 text-gray-800 py-3 px-6 rounded-lg font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          📅 Select Date & Time →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">📅 Select Date & Time</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">📅 Service Date</label>
        <input
          type="date"
          value={bookingDetails.date}
          onChange={(e) => setBookingDetails({...bookingDetails, date: e.target.value})}
          min={new Date().toISOString().split('T')[0]}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">⏰ Preferred Time Slot</label>
        <div className="grid grid-cols-1 gap-3">
          {generateTimeSlots().map((slot) => (
            <label key={slot} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="timeSlot"
                value={slot}
                checked={bookingDetails.time === slot}
                onChange={(e) => setBookingDetails({...bookingDetails, time: e.target.value})}
                className="mr-3 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
              />
              <span>{slot}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep(2)}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={!bookingDetails.date || !bookingDetails.time}
          className="flex-1 bg-yellow-400 text-gray-800 py-3 px-6 rounded-lg font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          💳 Proceed to Payment →
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">💳 Payment</h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">📋 Booking Summary</h3>
        <p><strong>🧹 Service:</strong> {cleaningTypeOptions.find(option => option.value === pricingData.cleaningType)?.label}</p>
        <p><strong>📅 Date:</strong> {new Date(bookingDetails.date).toLocaleDateString()}</p>
        <p><strong>⏰ Time:</strong> {bookingDetails.time}</p>
        <p><strong>📍 Address:</strong> {contactInfo.address}, {contactInfo.city}, {contactInfo.state}</p>
        <p><strong>💰 Total:</strong> ${calculatedPrice.toFixed(2)}</p>
      </div>

      <StripePaymentForm
        amount={calculatedPrice}
        email={contactInfo.email}
        description={`Cleaning service for ${contactInfo.firstName} ${contactInfo.lastName}`}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={(error) => console.error('Payment error:', error)}
      />

      <div className="mt-6">
        <button
          onClick={() => setStep(3)}
          className="w-full bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
        >
          ← Back to Date Selection
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-bold mb-6 text-green-600">Booking Confirmed!</h2>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <p className="text-lg mb-2"><strong>🎫 Booking Number:</strong> {bookingNumber}</p>
        <p className="text-gray-700">📧 We've sent a confirmation email to {contactInfo.email}</p>
      </div>

      <div className="text-left space-y-2 mb-6">
        <p><strong>🧹 Service:</strong> {cleaningTypeOptions.find(option => option.value === pricingData.cleaningType)?.label}</p>
        <p><strong>📅 Date:</strong> {new Date(bookingDetails.date).toLocaleDateString()}</p>
        <p><strong>⏰ Time:</strong> {bookingDetails.time}</p>
        <p><strong>📍 Address:</strong> {contactInfo.address}, {contactInfo.city}, {contactInfo.state}</p>
        <p><strong>💰 Total Paid:</strong> ${calculatedPrice.toFixed(2)}</p>
      </div>

      <button
        onClick={() => {
          setStep(1);
          setPricingData({ homeSize: '', bedrooms: '', bathrooms: '', cleaningType: '', frequency: '', extras: [] });
          setContactInfo({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '' });
          setBookingDetails({ date: '', time: '' });
          setCalculatedPrice(0);
          setIsCalculated(false);
          setPaymentSuccess(false);
          setBookingNumber('');
        }}
        className="bg-yellow-400 text-gray-800 py-3 px-6 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
      >
        Book Another Service
      </button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= stepNumber ? 'bg-yellow-400 text-gray-800' : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div className={`w-8 h-1 ${step > stepNumber ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  );
}
