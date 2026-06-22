import { useEffect, useState } from 'react';
import { getAllPatients } from '../../lib/db';
import { Patient } from '../../types';

export function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    const data = await getAllPatients();
    setPatients(data);
  };

  return (
    <div className="bg-white p-4 rounded border">
      <h3 className="font-semibold mb-2">Patients</h3>
      <ul>
        {patients.map(p => (
          <li key={p.id} className="border-b py-2">{p.name} ({p.nameAr}) - {p.phone}</li>
        ))}
      </ul>
    </div>
  );
}
