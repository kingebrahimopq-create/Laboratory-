import React from 'react';

interface DiagnosticLog {
  id: string;
  category: string;
  description: string;
  status: 'Pass' | 'Fail' | 'Warning';
  timestamp: string;
}

const mockLogs: DiagnosticLog[] = [
  { id: '1', category: 'Build', description: 'Vercel Deployment Check', status: 'Pass', timestamp: '2026-06-18 05:00:00' },
  { id: '2', category: 'ESM', description: 'Explicit .js extensions in imports', status: 'Pass', timestamp: '2026-06-18 05:05:00' },
  { id: '3', category: 'Build', description: 'pino-http call signatures', status: 'Pass', timestamp: '2026-06-18 05:10:00' },
  { id: '4', category: 'ESM', description: 'Express v5 application binding', status: 'Warning', timestamp: '2026-06-18 05:15:00' },
];

export const DiagnosticDashboard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full max-w-4xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Diagnostic Dashboard</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2 px-4 font-semibold text-slate-600">Category</th>
              <th className="py-2 px-4 font-semibold text-slate-600">Description</th>
              <th className="py-2 px-4 font-semibold text-slate-600">Status</th>
              <th className="py-2 px-4 font-semibold text-slate-600">Time</th>
            </tr>
          </thead>
          <tbody>
            {mockLogs.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 font-mono text-sm text-slate-700">{log.category}</td>
                <td className="py-3 px-4 text-sm text-slate-800">{log.description}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    log.status === 'Pass' ? 'bg-emerald-100 text-emerald-800' :
                    log.status === 'Warning' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-slate-500">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
