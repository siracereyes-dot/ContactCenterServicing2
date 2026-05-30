import React, { useMemo } from 'react';
import { BookingDraft, Room } from '../types';

interface BookingFormProps {
  selectedRoom: Room | null;
  onSubmit: (booking: BookingDraft) => void;
  data: BookingDraft;
  onDataChange: (data: BookingDraft) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ selectedRoom, onSubmit, data, onDataChange }) => {
  
  // Handle room selection updates to draft
  React.useEffect(() => {
    if (selectedRoom && selectedRoom.id !== data.roomId) {
      onDataChange({ ...data, roomId: selectedRoom.id });
    }
  }, [selectedRoom, onDataChange, data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onDataChange({ ...data, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  // Calculate Billing
  const billingDetails = useMemo(() => {
    if (!selectedRoom || !data.checkIn || !data.checkOut) return null;

    const start = new Date(data.checkIn);
    const end = new Date(data.checkOut);
    
    // Calculate difference in time
    const diffTime = end.getTime() - start.getTime();
    // Calculate difference in days
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (nights <= 0) return null;

    const subtotal = nights * selectedRoom.price;
    const tax = subtotal * 0.12; // 12% VAT
    const total = subtotal + tax;

    return {
      nights,
      subtotal,
      tax,
      total
    };
  }, [selectedRoom, data.checkIn, data.checkOut]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        New Reservation
      </h2>

      {!selectedRoom ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 italic border-2 border-dashed border-slate-100 rounded-lg">
          Select a room to begin booking
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
            <div>
                <p className="text-sm text-blue-800 font-bold">Room {selectedRoom.number}</p>
                <p className="text-xs text-blue-600">{selectedRoom.type} • {selectedRoom.view}</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold text-blue-900">₱{selectedRoom.price.toLocaleString()}</p>
                <p className="text-[10px] text-blue-500">per night</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Guest Name</label>
            <input
              required
              type="text"
              name="guestName"
              value={data.guestName}
              onChange={handleChange}
              placeholder="Juan Dela Cruz"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Email Address</label>
            <input
              required
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              placeholder="guest@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Check-In</label>
              <input
                required
                type="date"
                name="checkIn"
                value={data.checkIn}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Check-Out</label>
              <input
                required
                type="date"
                name="checkOut"
                value={data.checkOut}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Guests</label>
              <input
                type="number"
                min="1"
                max="4"
                name="guests"
                value={data.guests}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Phone</label>
              <input
                type="tel"
                name="phone"
                value={data.phone}
                onChange={handleChange}
                placeholder="0917 000 0000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Special Requests</label>
            <textarea
              name="notes"
              value={data.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Early check-in, extra pillows, etc..."
            />
          </div>

          {/* Payment Method / Deposit Guarantee Options */}
          <div className="border-t border-slate-200 pt-4 mt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Payment / Deposit Guarantee Method
            </h3>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                type="button"
                id="payment-method-card"
                onClick={() => onDataChange({ ...data, paymentMethod: 'Card' })}
                className={`py-2 px-1 text-xs font-semibold border rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                  data.paymentMethod === 'Card' || !data.paymentMethod
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Credit Card
              </button>

              <button
                type="button"
                id="payment-method-gcash"
                onClick={() => onDataChange({ ...data, paymentMethod: 'GCash' })}
                className={`py-2 px-1 text-xs font-semibold border rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                  data.paymentMethod === 'GCash'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="w-5 h-5 bg-blue-600 text-white flex items-center justify-center rounded-full font-bold text-[9px]">G</div>
                GCash
              </button>

              <button
                type="button"
                id="payment-method-paymaya"
                onClick={() => onDataChange({ ...data, paymentMethod: 'PayMaya' })}
                className={`py-2 px-1 text-xs font-semibold border rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                  data.paymentMethod === 'PayMaya'
                    ? 'border-green-600 bg-green-50 text-green-700 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="w-5 h-5 bg-green-600 text-white flex items-center justify-center rounded font-bold text-[9px]">M</div>
                PayMaya
              </button>
            </div>

            {/* Form content based on Payment Method */}
            {(data.paymentMethod === 'Card' || !data.paymentMethod) ? (
              <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Cardholder Name</label>
                  <input
                    type="text"
                    name="cardHolderName"
                    value={data.cardHolderName || ''}
                    onChange={handleChange}
                    placeholder="As shown on card"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={data.cardNumber || ''}
                    onChange={handleChange}
                    placeholder="4111 2222 3333 4444"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Expiry Date</label>
                    <input
                      type="text"
                      name="cardExpiry"
                      value={data.cardExpiry || ''}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">CVC / CVV</label>
                    <input
                      type="password"
                      name="cardCvc"
                      value={data.cardCvc || ''}
                      onChange={handleChange}
                      placeholder="***"
                      maxLength={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Online Payment Invoicing ({data.paymentMethod})</span>
                <p className="text-xs text-slate-650 max-w-[280px]">
                  Ask the customer during the live call if they would like to settle the booking deposit using {data.paymentMethod}.
                </p>

                {/* Display Payment Status Badge */}
                <div className="flex items-center gap-2 mt-2 w-full justify-center">
                  <span className="text-xs text-slate-700">Payment Status:</span>
                  {data.paymentStatus === 'Paid' ? (
                    <div id="payment-status-badge" className="flex items-center gap-1.5 px-3 py-1 bg-green-100 border border-green-200 text-green-700 rounded-full text-xs font-bold animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      PAID via {data.paymentMethod}
                    </div>
                  ) : (
                    <div id="payment-status-badge" className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                      PENDING AI Confirmation
                    </div>
                  )}
                </div>

                {/* Agent Tooltip instruction */}
                <div className="text-[10px] bg-blue-50 text-blue-750 p-2.5 rounded-lg border border-blue-100 italic mt-2 w-full text-left">
                  <p className="font-semibold text-blue-900 not-italic mb-1">💡 Instructions for Trainee Agent:</p>
                  1. Offer to send a secure link via {data.paymentMethod}.<br />
                  2. Say: <strong className="text-blue-900 not-italic">"I've initiated the {data.paymentMethod} payment on your device. Please verify."</strong><br />
                  3. Wait for the customer (Live AI) to complete the transaction and say they are done!
                </div>
              </div>
            )}
          </div>
          
          {/* Billing Summary */}
          {billingDetails && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2 space-y-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-200 pb-1">Billing Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Room Charges ({billingDetails.nights} nights)</span>
                <span className="font-medium text-slate-900">₱{billingDetails.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">VAT (12%)</span>
                <span className="font-medium text-slate-900">₱{billingDetails.tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center">
                <span className="font-bold text-slate-800">Total Due</span>
                <span className="font-bold text-xl text-blue-600">₱{billingDetails.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex justify-center items-center gap-2"
          >
            Confirm Reservation
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
};