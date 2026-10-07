// =========================================================================
// Dental Practice Intelligence & Automation System — Repository & State Engine
// =========================================================================

export type DBAppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type DBMessageType = 'T24_REMINDER' | 'T2_FINAL_ALERT' | 'POST_OP_CARE' | 'RECALL_6_MONTH' | 'TRIAGE_RESPONSE';
export type DBMessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface DBPatient {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  lastVisitDate?: string; // ISO date string
  treatmentType?: string;
  recallSent: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBAppointment {
  id: string;
  patientId?: string;
  patientName: string;
  phoneNumber: string;
  treatmentType: string;
  slotTime: string; // ISO datetime string
  status: DBAppointmentStatus;
  clinicianName: string;
  notes?: string;
  isEmergency: boolean;
  source: string;
  postOpDispatchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBMessageLog {
  id: string;
  appointmentId?: string;
  patientPhone: string;
  patientName?: string;
  messageType: DBMessageType;
  templateName: string;
  content: string;
  status: DBMessageStatus;
  whatsappMessageId?: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface DBWaitlistEntry {
  id: string;
  patientName: string;
  phoneNumber: string;
  treatmentType: string;
  preferredDate?: string;
  notes?: string;
  alerted: boolean;
  createdAt: string;
}

// Initial in-memory & synchronized store (persisted in global state across hot reloads)
interface SystemDatabase {
  patients: DBPatient[];
  appointments: DBAppointment[];
  messageLogs: DBMessageLog[];
  waitlist: DBWaitlistEntry[];
}

declare global {
  // eslint-disable-next-line no-var
  var __dentalSystemDB: SystemDatabase | undefined;
}

function initializeSeedData(): SystemDatabase {
  const now = new Date();
  
  // Create dates for testing lifecycle triggers
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 182 * 24 * 60 * 60 * 1000);
  const sevenMonthsAgo = new Date(now.getTime() - 210 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const initialPatients: DBPatient[] = [
    {
      id: 'pat-1',
      name: 'Oliver Featherstone',
      phoneNumber: '+44 7700 900123',
      email: 'oliver.f@example.co.uk',
      lastVisitDate: sixMonthsAgo.toISOString().split('T')[0],
      treatmentType: 'Checkup & Airflow Scaling',
      recallSent: false,
      notes: 'Due for 6-month preventive hygiene examination',
      createdAt: sixMonthsAgo.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'pat-2',
      name: 'Lady Camilla Cavendish',
      phoneNumber: '+44 7700 900456',
      email: 'camilla.c@example.co.uk',
      lastVisitDate: sevenMonthsAgo.toISOString().split('T')[0],
      treatmentType: 'Comprehensive Oral Exam & Scaling',
      recallSent: false,
      notes: 'Private patient, prefers morning appointments',
      createdAt: sevenMonthsAgo.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'pat-3',
      name: 'Marcus Sterling',
      phoneNumber: '+44 7700 900789',
      email: 'marcus.s@example.co.uk',
      lastVisitDate: yesterday.toISOString().split('T')[0],
      treatmentType: 'Microscopic Root Canal Therapy (RCT)',
      recallSent: false,
      notes: 'Completed upper molar RCT visit 1',
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'pat-4',
      name: 'Amara Khan',
      phoneNumber: '+44 7700 900890',
      email: 'amara.khan@example.co.uk',
      lastVisitDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      treatmentType: 'Invisalign Consultation',
      recallSent: true,
      notes: 'Active clear aligner treatment plan',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const initialAppointments: DBAppointment[] = [
    {
      id: 'apt-t24-sample',
      patientId: 'pat-1',
      patientName: 'Charlotte Kensington',
      phoneNumber: '+44 7700 900111',
      treatmentType: 'Invisalign® Clear Aligners & 3D Simulation',
      slotTime: tomorrow.toISOString(),
      status: 'PENDING',
      clinicianName: 'Dr. Alistair Vance',
      notes: 'T-24h reminder scheduled to verify attendance',
      isEmergency: false,
      source: 'Website Widget',
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'apt-t2-sample',
      patientId: 'pat-2',
      patientName: 'Edward Montgomery',
      phoneNumber: '+44 7700 900222',
      treatmentType: 'Precision Straumann® Titanium Dental Implant',
      slotTime: inTwoHours.toISOString(),
      status: 'CONFIRMED',
      clinicianName: 'Dr. Alistair Vance',
      notes: 'T-2h location & parking guide dispatched',
      isEmergency: false,
      source: 'Website Widget',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'apt-completed-sample',
      patientId: 'pat-3',
      patientName: 'Marcus Sterling',
      phoneNumber: '+44 7700 900789',
      treatmentType: 'Surgical Extraction & Bone Graft',
      slotTime: yesterday.toISOString(),
      status: 'COMPLETED',
      clinicianName: 'Dr. Sarah Jenkins',
      notes: 'Post-op surgical care pack dispatched via WhatsApp',
      isEmergency: false,
      source: 'Reception',
      postOpDispatchedAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'apt-emergency-sample',
      patientName: 'Tariq Mehmood',
      phoneNumber: '+44 7700 900333',
      treatmentType: '24/7 Overnight Emergency Triage',
      slotTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      status: 'CONFIRMED',
      clinicianName: 'Dr. Michael Zhao',
      notes: 'Severe nocturnal lower molar pain; triaged via Roman Urdu AI widget',
      isEmergency: true,
      source: 'DentalAgentWidget (Urdu)',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const initialLogs: DBMessageLog[] = [
    {
      id: 'msg-log-1',
      appointmentId: 'apt-completed-sample',
      patientPhone: '+44 7700 900789',
      patientName: 'Marcus Sterling',
      messageType: 'POST_OP_CARE',
      templateName: 'vertex_postop_extraction_v1',
      content: 'Hello Marcus, Dr. Sarah Jenkins has logged your extraction as complete. Keep gauze biting pressure for 45 mins. Do not rinse or use a straw for 24h.',
      status: 'READ',
      whatsappMessageId: 'wamid.HBgLMjQ4MT...',
      sentAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      deliveredAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000 + 1000).toISOString(),
      readAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000 + 45000).toISOString(),
    },
  ];

  const initialWaitlist: DBWaitlistEntry[] = [
    {
      id: 'wait-1',
      patientName: 'Sophia Al-Mansoor',
      phoneNumber: '+44 7700 900999',
      treatmentType: 'Invisalign® Clear Aligners & 3D Simulation',
      preferredDate: tomorrow.toISOString().split('T')[0],
      notes: 'Patient requested immediate notification if any tomorrow slot frees up.',
      alerted: false,
      createdAt: now.toISOString(),
    },
  ];

  return {
    patients: initialPatients,
    appointments: initialAppointments,
    messageLogs: initialLogs,
    waitlist: initialWaitlist,
  };
}

if (!global.__dentalSystemDB) {
  global.__dentalSystemDB = initializeSeedData();
}

const db = global.__dentalSystemDB;

// =========================================================================
// REPOSITORY METHODS
// =========================================================================

export const AppointmentRepository = {
  async getAll(filter?: { date?: string; clinician?: string; status?: DBAppointmentStatus }): Promise<DBAppointment[]> {
    let result = [...db.appointments];
    if (filter?.status) {
      result = result.filter(a => a.status === filter.status);
    }
    if (filter?.clinician && filter.clinician !== 'All Clinicians') {
      result = result.filter(a => a.clinicianName === filter.clinician);
    }
    if (filter?.date) {
      result = result.filter(a => a.slotTime.startsWith(filter.date!));
    }
    // Sort descending by slotTime
    return result.sort((a, b) => new Date(b.slotTime).getTime() - new Date(a.slotTime).getTime());
  },

  async getById(id: string): Promise<DBAppointment | null> {
    const apt = db.appointments.find(a => a.id === id);
    return apt ? { ...apt } : null;
  },

  async create(data: {
    patientName: string;
    phoneNumber: string;
    treatmentType: string;
    slotTime: string;
    clinicianName?: string;
    notes?: string;
    isEmergency?: boolean;
    source?: string;
  }): Promise<DBAppointment> {
    const newAppointment: DBAppointment = {
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientName: data.patientName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      treatmentType: data.treatmentType,
      slotTime: data.slotTime,
      status: 'CONFIRMED',
      clinicianName: data.clinicianName || 'Dr. Alistair Vance',
      notes: data.notes || '',
      isEmergency: !!data.isEmergency,
      source: data.source || 'Website Widget',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.appointments.unshift(newAppointment);

    // Sync or update patient record
    let patient = db.patients.find(p => p.phoneNumber === data.phoneNumber);
    if (!patient) {
      patient = {
        id: `pat-${Date.now()}`,
        name: data.patientName,
        phoneNumber: data.phoneNumber,
        treatmentType: data.treatmentType,
        recallSent: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.patients.push(patient);
    }
    newAppointment.patientId = patient.id;

    return newAppointment;
  },

  async updateStatus(
    id: string,
    status: DBAppointmentStatus,
    options?: { triggerAutomations?: boolean }
  ): Promise<{ appointment: DBAppointment; reclaimedSlot?: boolean; waitlistAlerted?: DBWaitlistEntry | null }> {
    const aptIndex = db.appointments.findIndex(a => a.id === id);
    if (aptIndex === -1) {
      throw new Error(`Appointment with ID ${id} not found.`);
    }

    const previousStatus = db.appointments[aptIndex].status;
    db.appointments[aptIndex].status = status;
    db.appointments[aptIndex].updatedAt = new Date().toISOString();
    const updatedApt = db.appointments[aptIndex];

    let reclaimedSlot = false;
    let waitlistAlerted: DBWaitlistEntry | null = null;

    // 1. Auto-Cancellation & Slot Reclaim Trigger
    if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      reclaimedSlot = true;
      // Search waitlist for next pending inquiry
      const pendingWaitlist = db.waitlist.find(w => !w.alerted);
      if (pendingWaitlist) {
        pendingWaitlist.alerted = true;
        waitlistAlerted = pendingWaitlist;

        // Log automated waitlist alert message
        await MessageLogRepository.create({
          appointmentId: id,
          patientPhone: pendingWaitlist.phoneNumber,
          patientName: pendingWaitlist.patientName,
          messageType: 'TRIAGE_RESPONSE',
          templateName: 'vertex_waitlist_reclaim_v1',
          content: `Hi ${pendingWaitlist.patientName}, a priority slot just opened up for ${updatedApt.treatmentType} on ${new Date(updatedApt.slotTime).toLocaleDateString('en-GB')} at ${new Date(updatedApt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Reply YES to reserve immediately.`,
          status: 'SENT',
        });
      }
    }

    // 2. Post-Treatment Automated Care Dispatcher Trigger
    if (status === 'COMPLETED' && (!updatedApt.postOpDispatchedAt || options?.triggerAutomations)) {
      updatedApt.postOpDispatchedAt = new Date().toISOString();
      await PostOpCareService.dispatch(updatedApt);
    }

    return { appointment: updatedApt, reclaimedSlot, waitlistAlerted };
  },

  async delete(id: string): Promise<boolean> {
    const index = db.appointments.findIndex(a => a.id === id);
    if (index === -1) return false;
    db.appointments.splice(index, 1);
    return true;
  },

  // Check slot availability
  async getAvailability(date: string, clinicianName: string = 'Dr. Alistair Vance'): Promise<{ slot: string; available: boolean }[]> {
    const standardSlots = [
      '09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM', '12:00 PM',
      '02:00 PM', '02:45 PM', '03:30 PM', '04:15 PM', '05:00 PM'
    ];

    const bookedSlotsOnDate = db.appointments
      .filter(a => a.status !== 'CANCELLED' && a.clinicianName === clinicianName && a.slotTime.startsWith(date))
      .map(a => {
        const time = new Date(a.slotTime);
        return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      });

    return standardSlots.map(s => {
      // Check if matches booked slots
      const isBooked = bookedSlotsOnDate.some(b => b.replace(/^0/, '') === s.replace(/^0/, ''));
      return {
        slot: s,
        available: !isBooked,
      };
    });
  },
};

export const PatientRepository = {
  async getAll(): Promise<DBPatient[]> {
    return [...db.patients];
  },

  async findOverdueRecalls(daysOverdue: number = 180): Promise<DBPatient[]> {
    const cutoffDate = new Date(Date.now() - daysOverdue * 24 * 60 * 60 * 1000);
    return db.patients.filter(p => {
      if (p.recallSent || !p.lastVisitDate) return false;
      const lastVisit = new Date(p.lastVisitDate);
      return lastVisit <= cutoffDate;
    });
  },

  async markRecallSent(patientId: string): Promise<void> {
    const patient = db.patients.find(p => p.id === patientId);
    if (patient) {
      patient.recallSent = true;
      patient.updatedAt = new Date().toISOString();
    }
  },
};

export const MessageLogRepository = {
  async getAll(limit: number = 50): Promise<DBMessageLog[]> {
    return [...db.messageLogs]
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .slice(0, limit);
  },

  async create(data: {
    appointmentId?: string;
    patientPhone: string;
    patientName?: string;
    messageType: DBMessageType;
    templateName: string;
    content: string;
    status?: DBMessageStatus;
  }): Promise<DBMessageLog> {
    const now = new Date();
    const newLog: DBMessageLog = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      appointmentId: data.appointmentId,
      patientPhone: data.patientPhone,
      patientName: data.patientName || 'Patient',
      messageType: data.messageType,
      templateName: data.templateName,
      content: data.content,
      status: data.status || 'SENT',
      whatsappMessageId: `wamid.${Math.random().toString(36).substring(2, 15)}`,
      sentAt: now.toISOString(),
      deliveredAt: new Date(now.getTime() + 1200).toISOString(),
      readAt: new Date(now.getTime() + 45000).toISOString(),
    };

    db.messageLogs.unshift(newLog);
    return newLog;
  },
};

export const WaitlistRepository = {
  async getAll(): Promise<DBWaitlistEntry[]> {
    return [...db.waitlist];
  },

  async add(entry: Omit<DBWaitlistEntry, 'id' | 'createdAt' | 'alerted'>): Promise<DBWaitlistEntry> {
    const newEntry: DBWaitlistEntry = {
      id: `wait-${Date.now()}`,
      ...entry,
      alerted: false,
      createdAt: new Date().toISOString(),
    };
    db.waitlist.push(newEntry);
    return newEntry;
  },
};

// =========================================================================
// POST-OP CARE SERVICE
// =========================================================================

export const PostOpCareService = {
  generatePayload(treatmentType: string, patientName: string): { templateName: string; content: string } {
    const t = treatmentType.toLowerCase();

    if (t.includes('extraction') || t.includes('surgery') || t.includes('implant')) {
      return {
        templateName: 'vertex_postop_oral_surgery_v2',
        content: `Dr. Vance & the Vertex Surgical Suite care team:
Hello ${patientName}, here are your essential immediate recovery steps:
1. GAUZE PRESSURE: Keep sterile cotton gauze firmly bitten for 45 mins. Replace if saturated.
2. NO SPITTING / NO STRAWS: Avoid vigorous rinsing, spitting, or straws for 24h to protect blood clot.
3. DIET: Cool, soft foods only (Greek yogurt, lukewarm soup, smoothies without seeds).
4. SWELLING: Apply cold compress to cheek (15 mins on, 15 mins off).
Emergency line: +44 20 7946 0888 (24/7 on-call surgical registrar).`,
      };
    }

    if (t.includes('root canal') || t.includes('rct') || t.includes('endodontic')) {
      return {
        templateName: 'vertex_postop_root_canal_v2',
        content: `Dr. Vance & the Vertex Endodontics Suite:
Hello ${patientName}, following your root canal treatment:
1. CHEWING: Please avoid chewing on this tooth until your permanent crown is fitted.
2. SENSITIVITY: Mild tenderness to pressure is normal for 48-72 hours.
3. TEMPORARY FILLING: Soft temporary filling is in place; avoid hard, sticky sweets.
4. NEXT STEP: Our reception will contact you to book your definitive 5-axis CEREC porcelain crown.`,
      };
    }

    if (t.includes('whitening')) {
      return {
        templateName: 'vertex_postop_whitening_v1',
        content: `Dr. Vance & the Vertex Cosmetic Studio:
Hello ${patientName}, congratulations on your new brighter smile!
1. "WHITE DIET" FOR 48H: Enamel pores are currently open. Avoid coffee, red wine, curry, and soy sauce.
2. SENSITIVITY: If teeth feel sensitive, apply a dab of Sensodyne toothpaste directly on teeth overnight.
3. HYDRATION: Drink plenty of room-temperature water.`,
      };
    }

    // Default preventive/general scaling post-op
    return {
      templateName: 'vertex_postop_general_v1',
      content: `Hello ${patientName}, thank you for visiting Vertex Dental Lab today!
1. GUMS: Mild gum tingling is normal for 12-24h after deep biofilm airflow polishing.
2. RINSING: Warm salt water rinse (1/2 tsp salt in warm water) tonight will soothe gum tissue.
3. BRUSHING: Continue gentle circular brushing with a soft-bristled brush.
See you in 6 months for your routine preventive checkup!`,
    };
  },

  async dispatch(appointment: DBAppointment): Promise<DBMessageLog> {
    const payload = this.generatePayload(appointment.treatmentType, appointment.patientName);
    return MessageLogRepository.create({
      appointmentId: appointment.id,
      patientPhone: appointment.phoneNumber,
      patientName: appointment.patientName,
      messageType: 'POST_OP_CARE',
      templateName: payload.templateName,
      content: payload.content,
      status: 'SENT',
    });
  },
};
