import React, { useState } from 'react';
import { addPatient } from '../../lib/db';
import { UserMinus, UserPlus, Phone, Calendar, MapPin } from 'lucide-react';

export function AddPatientForm({ onAdded, onCancel }: { onAdded: () => void; onCancel?: () => void }) {
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!name || !nameAr || !phone || !gender || !dob) {
        throw new Error('الرجاء تعبئة كافة الحقول المطلوبة / Please fulfill all required fields');
      }

      const patientData = {
        name,
        nameAr,
        phone,
        gender,
        dob: new Date(dob),
        address: address || undefined,
      };

      await addPatient(patientData);
      setName('');
      setNameAr('');
      setPhone('');
      setGender('male');
      setDob('');
      setAddress('');
      onAdded();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'فشل إدخال بيانات المريض / Failed to add patient.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-md flex flex-col gap-5 text-right font-sans" dir="rtl">
      <div>
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 justify-end">
          <span>تسجيل مريض جديد</span>
          <UserPlus className="w-5 h-5 text-indigo-600" />
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">سجل البيانات الطبية والملف الموحد للمريض</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Arabic Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">اسم المريض (بالعربي) *</label>
          <input
            type="text"
            required
            value={nameAr}
            onChange={e => setNameAr(e.target.value)}
            placeholder="مثال: يوسف جاسم الشمري"
            className="p-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent text-right"
          />
        </div>

        {/* English Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">Patient's Name (English) *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Yousef Jassim Alshammari"
            className="p-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent text-left"
            dir="ltr"
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 justify-end">
            <span>رقم الهاتف *</span>
            <Phone className="w-3.5 h-3.5 text-slate-400" />
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="05xxxxxxx"
            className="p-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent text-right font-mono"
            dir="ltr"
          />
        </div>

        {/* Type / Gender */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">الجنس / Gender *</label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 text-right"
          >
            <option value="male">ذكر / Male</option>
            <option value="female">أنثى / Female</option>
          </select>
        </div>

        {/* DOB */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 justify-end">
            <span>تاريخ الميلاد *</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </label>
          <input
            type="date"
            required
            value={dob}
            onChange={e => setDob(e.target.value)}
            className="p-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-right"
          />
        </div>

        {/* Address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 justify-end">
            <span>العنوان الاختياري</span>
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
          </label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="مثال: الرياض - حي الملقا"
            className="p-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent text-right"
          />
        </div>
      </div>

      <div className="flex justify-start gap-3 mt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl shadow transition-colors flex items-center gap-1.5"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            'تسجيل المريض وطباعة الرمز'
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors"
          >
            إلغاء
          </button>
        )}
      </div>
    </form>
  );
}
