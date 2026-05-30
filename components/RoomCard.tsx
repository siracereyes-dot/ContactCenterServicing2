import React from 'react';
import { Room, RoomStatus } from '../types';

interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  onSelect: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, isSelected, onSelect }) => {
  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case RoomStatus.OCCUPIED: return 'bg-rose-100 text-rose-800 border-rose-200';
      case RoomStatus.DIRTY: return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      onClick={() => onSelect(room)}
      className={`relative p-4 border rounded-xl transition-all cursor-pointer hover:shadow-md ${
        isSelected 
          ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-slate-800">#{room.number}</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{room.type}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(room.status)}`}>
          {room.status}
        </span>
      </div>

      <div className="space-y-1 text-sm text-slate-600 mt-3">
        <div className="flex items-center justify-between">
          <span>View:</span>
          <span className="font-medium text-slate-900">{room.view}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Bed:</span>
          <span className="font-medium text-slate-900">{room.bed}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Rate:</span>
          <span className="font-medium text-slate-900">₱{room.price.toLocaleString()}/night</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
        {room.amenities.slice(0, 3).map((amenity, idx) => (
          <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
            {amenity}
          </span>
        ))}
        {room.amenities.length > 3 && (
          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
            +{room.amenities.length - 3}
          </span>
        )}
      </div>
    </div>
  );
};