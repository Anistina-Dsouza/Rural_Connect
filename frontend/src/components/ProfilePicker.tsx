import React, { useState } from 'react';
import { FamilyProfile, Language } from '../types';
import { translations } from '../data/translations';
import { Users, Plus, Check, Heart, Baby, Shield, X } from 'lucide-react';

interface ProfilePickerProps {
  currentLanguage: Language;
  isOpen: boolean;
  onClose: () => void;
  profiles: FamilyProfile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onAddProfile: (profile: FamilyProfile) => void;
}

export const ProfilePicker: React.FC<ProfilePickerProps> = ({
  currentLanguage,
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddProfile
}) => {
  const t = translations[currentLanguage];
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState<'Child' | 'Spouse' | 'Parent' | 'Other'>('Child');
  const [newAge, setNewAge] = useState<number>(8);
  const [newGender, setNewGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [isPregnant, setIsPregnant] = useState(false);
  const [chronicCondition, setChronicCondition] = useState('');

  if (!isOpen) return null;

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newProfile: FamilyProfile = {
      id: `prof-${Date.now()}`,
      name: newName.trim(),
      relation: newRelation,
      age: Number(newAge) || 1,
      gender: newGender,
      isPregnant: newGender === 'Female' ? isPregnant : false,
      chronicConditions: chronicCondition.trim() ? [chronicCondition.trim()] : [],
      currentMedications: [],
      avatar: newRelation === 'Child' ? '👶🏽' : newRelation === 'Parent' ? '👴🏽' : newGender === 'Female' ? '👩🏽' : '👨🏽'
    };

    onAddProfile(newProfile);
    setShowAddForm(false);
    setNewName('');
    setChronicCondition('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">{t.switchProfile}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profiles List */}
        {!showAddForm ? (
          <div>
            <div className="space-y-2.5 mb-5">
              {profiles.map((p) => {
                const isSelected = p.id === activeProfileId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProfile(p.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition text-left ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-1 bg-slate-100 rounded-xl">{p.avatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                            {p.relation}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {p.age} Yrs • {p.gender}
                          {p.isPregnant && ' • Pregnant 🤰'}
                        </p>
                        {p.chronicConditions && p.chronicConditions.length > 0 && p.chronicConditions[0] !== 'None' && (
                          <span className="inline-block text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 font-medium border border-amber-200">
                            {p.chronicConditions.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNewProfile}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateProfile} className="space-y-3">
            <h3 className="font-bold text-sm text-slate-800">Add Dependent Family Profile</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Geeta Patel"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relation</label>
                <select
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value as any)}
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Child">Child (બાળક / बच्चा)</option>
                  <option value="Parent">Parent (વૃદ્ધ / माता-पिता)</option>
                  <option value="Spouse">Spouse (પતિ/પત્ની)</option>
                  <option value="Other">Other Family</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={newAge}
                  onChange={(e) => setNewAge(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as any)}
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {newGender === 'Female' && newAge >= 15 && newAge <= 50 && (
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="preg"
                    checked={isPregnant}
                    onChange={(e) => setIsPregnant(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <label htmlFor="preg" className="text-xs font-medium text-slate-700">Currently Pregnant</label>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chronic Ailments (Optional)</label>
              <input
                type="text"
                placeholder="e.g. High BP, Asthma, Diabetes"
                value={chronicCondition}
                onChange={(e) => setChronicCondition(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

