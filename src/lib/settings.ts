export interface ClinicSettings {
  phone: string;
  whatsapp: string;
  receptionDesk: string;
  address: string;
  workHours: string;
  clinicName: string;
}

const DEFAULT_SETTINGS: ClinicSettings = {
  phone: "920012345",
  whatsapp: "0554321098",
  receptionDesk: "0554321099",
  address: "شارع التخصصي، حي السليمانية، الرياض 12223، المملكة العربية السعودية",
  workHours: "السبت - الخميس: 7:00 ص - 11:00 م | الجمعة: 1:00 م - 9:00 م",
  clinicName: "النخبة للمختبر الطبي الإلكتروني"
};

export const getClinicSettings = (): ClinicSettings => {
  try {
    const stored = localStorage.getItem('lis_clinic_settings');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Error reading settings", e);
  }
  return DEFAULT_SETTINGS;
};

export const saveClinicSettings = (settings: ClinicSettings) => {
  try {
    localStorage.setItem('lis_clinic_settings', JSON.stringify(settings));
  } catch (e) {
    console.error("Error saving settings", e);
  }
};
