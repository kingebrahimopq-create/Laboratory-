import { describe, it, expect } from 'vitest';
import { PrinterService, PrinterConnectionType, PaperSize } from '../services/printer-service';
import { LabTest, Patient, DoctorSettings } from '../types';

describe('Printer Service', () => {
  it('should initialize with disconnected status', () => {
    const printer = new PrinterService();
    const status = printer.getStatus();
    
    expect(status.connected).toBe(false);
    expect(status.type).toBe(PrinterConnectionType.DISCONNECTED);
    expect(status.status).toBe('offline');
  });

  it('should connect to network printer', async () => {
    const printer = new PrinterService();
    const result = await printer.connect({
      type: PrinterConnectionType.NETWORK,
      ipAddress: '192.168.1.100',
      port: 9100,
      paperSize: PaperSize.THERMAL_80MM
    });
    
    expect(result).toBe(true);
    expect(printer.isConnected()).toBe(true);
    expect(printer.getStatus().type).toBe(PrinterConnectionType.NETWORK);
  });

  it('should disconnect from printer', async () => {
    const printer = new PrinterService();
    await printer.connect({ type: PrinterConnectionType.NETWORK });
    expect(printer.isConnected()).toBe(true);
    
    printer.disconnect();
    expect(printer.isConnected()).toBe(false);
    expect(printer.getStatus().status).toBe('offline');
  });

  it('should generate print result for test report', async () => {
    const printer = new PrinterService();
    await printer.connect({ type: PrinterConnectionType.NETWORK });

    const test: LabTest = {
      id: 'LAB-TEST-001',
      patientId: 'EMR-TEST-001',
      patientName: 'Test Patient',
      patientNameEn: 'Test Patient',
      testType: 'CBC',
      titleAr: 'صورة دم كاملة',
      titleEn: 'Complete Blood Count',
      requestDate: '2026-06-13',
      sampleStatus: 'approved',
      parameters: [
        { name: 'Hemoglobin', nameAr: 'الهيموجلوبين', value: 14.2, unit: 'g/dL', minNormal: 12.5, maxNormal: 17.5, isAbnormal: false }
      ],
      cost: 180,
      paidAmount: 180,
      barcode: '12345678',
      qrToken: 'VERIFIED-CBC-12345678-2026'
    };

    const patient: Patient = {
      id: 'EMR-TEST-001',
      name: 'Test Patient',
      nameEn: 'Test Patient',
      phone: '0123456789',
      gender: 'ذكر',
      birthDate: '1990-01-01',
      bloodType: 'A+'
    };

    const settings: DoctorSettings = {
      labNameAr: 'Test Lab',
      labNameEn: 'Test Lab',
      doctorName: 'Test Doctor',
      doctorLicense: 'TEST-123',
      receptionUsername: 'reception',
      receptionPassword: 'pass',
      receptionPermissions: [],
      allowBiometricBypass: false,
      enableTechnicianPlatform: true,
      enableAndroidSimulator: false,
      canUploadWithFiles: true,
      canUploadWithImages: true,
      canUploadWithTyping: true,
      customTestPricing: { CBC: 180, LIPID: 240, LIVER: 300, GLUCOSE: 120, THYROID: 450, KIDNEY: 200 },
      enableGoogleDriveBackup: false,
      googleDriveToken: '',
      googleDriveBackupInterval: 'daily',
      enableElectronicPrinter: true,
      allowResultCopying: true,
      printerConnectionType: 'network',
      printerIpAddress: '192.168.1.100'
    };

    const result = await printer.printTestReport(test, patient, settings);
    
    expect(result.success).toBe(true);
    expect(result.timestamp).toBeDefined();
    expect(result.jobId).toBeDefined();
  });

  it('should print barcode', async () => {
    const printer = new PrinterService();
    await printer.connect({ type: PrinterConnectionType.NETWORK });

    const result = await printer.printBarcode('12345678');
    
    expect(result.success).toBe(true);
    expect(result.timestamp).toBeDefined();
  });

  it('should print QR code', async () => {
    const printer = new PrinterService();
    await printer.connect({ type: PrinterConnectionType.NETWORK });

    const result = await printer.printQRCode('TEST-QR-DATA', 'Test Label');
    
    expect(result.success).toBe(true);
    expect(result.timestamp).toBeDefined();
  });

  it('should print receipt', async () => {
    const printer = new PrinterService();
    await printer.connect({ type: PrinterConnectionType.NETWORK });

    const result = await printer.printReceipt(
      'Lab Receipt',
      [
        { label: 'CBC Test', value: '180 EGP' },
        { label: 'Discount', value: '0%' }
      ],
      '180 EGP'
    );
    
    expect(result.success).toBe(true);
    expect(result.timestamp).toBeDefined();
  });
});
